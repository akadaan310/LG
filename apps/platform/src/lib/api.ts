import {randomUUID,createHmac} from 'node:crypto';
import {z,type ZodType} from 'zod';
import type {SupabaseClient,User} from '@supabase/supabase-js';
import {accountDeletionSchema,authSchema,bookmarkSchema,consentSchema,contentDraftSchema,contentEditSchema,ideaSchema,mediaUpdateSchema,playbackSchema,preferencesSchema,profileSchema,progressSchema,reflectionSchema,rollbackSchema,transitionSchema,uuidSchema,type Role} from '@adequate/domain';
import {createTaskRouter,createRemoteAdapter,taskContracts,type TaskName,type AuthorizedSource} from '@adequate/ai';
import {ApiError,assertMutationOrigin,bearerToken,MAX_UPLOAD_BYTES,readBoundedBytes,readBoundedJson,safeRedirect,verifyUpload} from './guards';
import {appendCookies,createAuthRateClient,createRequestClient,serviceConfiguration,type Environment,type PendingCookie} from './supabase';

interface HandlerOptions {
  environment?:Environment;
  clientFactory?:(request:Request,environment:Environment,cookies:PendingCookie[])=>SupabaseClient;
  logger?:(entry:{traceId:string;method:string;operation:string;status:number;duration_ms:number})=>void;
}
interface RequestContext {request:Request;env:Environment;client:SupabaseClient;user:User|null;role:Role|null;traceId:string}
interface DatabaseError {code?:string;message?:string}
function database<T>(result:{data:T|null;error:DatabaseError|null}):T {
  if(result.error) {
    const code=result.error.code;
    if(code==='23505')throw new ApiError(409,'CONFLICT','This record already exists.');
    if(code==='23503'||code==='23514'||code==='22023')throw new ApiError(400,'INVALID_INPUT','The record does not meet the required constraints.');
    if(code==='42501'||code==='P0001')throw new ApiError(403,'OPERATION_DENIED','This operation is not permitted for the current account or content state.');
    if(code==='PGRST116')throw new ApiError(404,'NOT_FOUND','The requested record is not available.');
    throw new ApiError(503,'DATABASE_UNAVAILABLE','The data service is temporarily unavailable.');
  }
  return result.data as T;
}
function requireUser(ctx:RequestContext):User {if(!ctx.user)throw new ApiError(401,'AUTH_REQUIRED','Sign in to continue.');return ctx.user;}
function requireStaff(ctx:RequestContext):User {const user=requireUser(ctx);if(ctx.role!=='founder'&&ctx.role!=='editor')throw new ApiError(403,'ROLE_REQUIRED','An editorial account is required.');return user;}
function requireFounder(ctx:RequestContext):void {requireStaff(ctx);if(ctx.role!=='founder')throw new ApiError(403,'ROLE_REQUIRED','Founder approval is required.');}
function id(value:string):string {if(!uuidSchema.safeParse(value).success)throw new ApiError(400,'INVALID_INPUT','Provide a valid record ID.');return value;}
async function input<T>(ctx:RequestContext,schema:ZodType<T>):Promise<T> {const result=schema.safeParse(await readBoundedJson(ctx.request));if(!result.success)throw new ApiError(400,'INVALID_INPUT','Check the request fields and try again.');return result.data;}
async function rate(ctx:RequestContext,scope:string,limit=120,window=60):Promise<void> {
  requireUser(ctx);const allowed=database(await ctx.client.rpc('consume_rate_limit',{p_scope:scope,p_limit:limit,p_window_seconds:window}));
  if(allowed!==true)throw new ApiError(429,'RATE_LIMITED','Too many requests. Try again shortly.');
}
const contentColumns='id,slug,title,body,kind,state,audience,version,provenance,rights_verified,founder_approved,published_at,scheduled_at,updated_at,created_at';
const mediaColumns='id,content_id,mime_type,byte_size,rights_status,scan_status,transcript,chapters,restricted';
const staffMediaColumns=`${mediaColumns},rights_notes`;
const recoverySchema=z.object({email:z.email().max(254)}).strict();
const passwordSchema=z.object({password:z.string().min(12).max(128)}).strict();
const aiSchema=z.object({task:z.enum(Object.keys(taskContracts) as [TaskName,...TaskName[]]),input:z.unknown()}).strict();
const routers=new Map<string,ReturnType<typeof createTaskRouter>>();
function inferenceRouter(env:Environment) {
  const mode=env.AI_MODE??'disabled';
  if(mode==='disabled')return null;
  if(mode!=='mock'&&mode!=='oracle')return null;
  const key=mode==='oracle'?`${mode}:${env.ORACLE_GATEWAY_URL??''}`:mode;
  const existing=routers.get(key);if(existing)return existing;
  if(mode==='oracle'&&(!env.ORACLE_GATEWAY_URL||!env.ORACLE_GATEWAY_TOKEN))return null;
  const router=createTaskRouter(mode==='oracle'?{adapter:createRemoteAdapter({endpoint:env.ORACLE_GATEWAY_URL!,token:env.ORACLE_GATEWAY_TOKEN!})}:{});
  routers.set(key,router);return router;
}
function nativeAuthRedirect(env:Environment):string {
  // The redirect is deployment-owned and must also be allowed in Supabase Auth config.
  if(env.NATIVE_AUTH_REDIRECT_URL!=='adequate://auth/callback')throw new ApiError(503,'NATIVE_AUTH_UNAVAILABLE','Native authentication callbacks are not configured.');
  return env.NATIVE_AUTH_REDIRECT_URL;
}
async function authenticate(ctx:RequestContext):Promise<void> {
  const token=bearerToken(ctx.request);
  const result=await ctx.client.auth.getUser(token??undefined);
  if(result.error||!result.data.user) {
    if(token)throw new ApiError(401,'AUTH_REQUIRED','The session is invalid or expired.');
    ctx.user=null;ctx.role=null;return;
  }
  ctx.user=result.data.user;
  const active=database(await ctx.client.rpc('active_account'));
  if(active!==true)throw new ApiError(401,'ACCOUNT_INACTIVE','The account or session is no longer active.');
  const roles=database(await ctx.client.from('user_roles').select('role').eq('user_id',ctx.user.id)) as {role:Role}[];
  ctx.role=roles.find(row=>row.role==='founder')?.role??roles.find(row=>row.role==='editor')?.role??'member';
}
async function authRate(ctx:RequestContext,email:string,scope:string):Promise<void> {
  const admin=createAuthRateClient(ctx.env);
  // Anonymous auth rate limits require server-owned durable state; fail closed when not configured.
  if(!admin||!ctx.env.AUTH_RATE_LIMIT_SALT)throw new ApiError(503,'AUTH_GUARD_UNAVAILABLE','Authentication rate controls are not configured.');
  const address=ctx.env.TRUST_PROXY_HEADERS==='true'?(ctx.request.headers.get('x-forwarded-for')?.split(',')[0].trim()??'unknown'):'shared';
  const key=createHmac('sha256',ctx.env.AUTH_RATE_LIMIT_SALT).update(`${scope}:${address}:${email.toLowerCase()}`).digest('hex');
  const allowed=database(await admin.rpc('consume_auth_rate_limit',{p_key:key,p_limit:8,p_window_seconds:900}));
  if(allowed!==true)throw new ApiError(429,'RATE_LIMITED','Too many authentication attempts. Try again later.');
}
async function assertIssuedSessionActive(ctx:RequestContext,accessToken:string):Promise<void> {
  const issuedClient=createRequestClient(new Request(ctx.request.url,{headers:{authorization:`Bearer ${accessToken}`}}),ctx.env,[]);
  const verified=await issuedClient.auth.getUser(accessToken);
  if(verified.error||!verified.data.user)throw new ApiError(401,'AUTH_REQUIRED','The issued session could not be verified.');
  if(database(await issuedClient.rpc('active_account'))!==true)throw new ApiError(401,'ACCOUNT_INACTIVE','The account or session is no longer active.');
}
async function revokeSession(ctx:RequestContext):Promise<void> {
  const config=serviceConfiguration(ctx.env);
  const cookieSession=bearerToken(ctx.request)?null:await ctx.client.auth.getSession();
  const token=bearerToken(ctx.request)??cookieSession?.data.session?.access_token;
  if(!config||!token)throw new ApiError(401,'AUTH_REQUIRED','A verified session is required to sign out.');
  let result:Response;
  try{result=await fetch(`${config.url.replace(/\/$/,'')}/auth/v1/logout?scope=global`,{method:'POST',headers:{apikey:config.key,authorization:`Bearer ${token}`},signal:AbortSignal.any([ctx.request.signal,AbortSignal.timeout(5000)]),redirect:'error'});}catch{throw new ApiError(503,'AUTH_UNAVAILABLE','Session revocation could not be completed.');}
  if(!result.ok)throw new ApiError(503,'AUTH_UNAVAILABLE','Session revocation could not be completed.');
  // Explicit bearer revocation above works even for a stateless native client. Local sign-out clears SSR cookies.
  const cleared=await ctx.client.auth.signOut({scope:'local'});
  if(cleared.error)throw new ApiError(503,'AUTH_UNAVAILABLE','The local session could not be cleared.');
}
async function authOperation(ctx:RequestContext,action:string):Promise<{value:unknown;status?:number}|Response> {
  const {client,request}=ctx;const url=new URL(request.url);const origin=ctx.env.APP_ORIGIN??url.origin;
  if(action==='callback'&&request.method==='GET') {
    let error:unknown;
    const code=url.searchParams.get('code');const tokenHash=url.searchParams.get('token_hash');const type=url.searchParams.get('type');
    if(code)({error}=await client.auth.exchangeCodeForSession(code));
    else if(tokenHash&&['signup','email','recovery','invite','magiclink','email_change'].includes(type??''))({error}=await client.auth.verifyOtp({token_hash:tokenHash,type:type as 'email'}));
    else throw new ApiError(400,'INVALID_CALLBACK','The verification link is incomplete.');
    if(error)throw new ApiError(400,'INVALID_CALLBACK','The verification link is invalid or expired.');
    await authenticate(ctx);requireUser(ctx);
    return Response.redirect(new URL(type==='recovery'?'/auth?mode=password':safeRedirect(url.searchParams.get('next')),origin),303);
  }
  if(request.method!=='POST')throw new ApiError(405,'METHOD_NOT_ALLOWED','Use POST for this authentication operation.');
  if(action==='signup'||action==='login') {
    const body=await input(ctx,authSchema);
    if(action==='signup'&&ctx.env.AGE_POLICY_APPROVED!=='true')throw new ApiError(403,'AGE_POLICY_PENDING','Account creation awaits the owner-approved age policy.');
    await authRate(ctx,body.email,action);
    const native=request.headers.get('x-client-platform')==='native';
    const redirect=action==='signup'?(native?nativeAuthRedirect(ctx.env):`${origin}/api/auth/callback`):undefined;
    const result=action==='signup'?await client.auth.signUp({...body,options:{emailRedirectTo:redirect}}):await client.auth.signInWithPassword(body);
    if(result.error)throw new ApiError(action==='login'?401:400,'AUTH_FAILED',action==='login'?'The sign-in details were not accepted.':'Account creation could not be completed.');
    if(result.data.session)await assertIssuedSessionActive(ctx,result.data.session.access_token);
    return {value:{user:result.data.user?{id:result.data.user.id,email:result.data.user.email}:null,verification_required:!result.data.session,...(native?{session:result.data.session?{access_token:result.data.session.access_token,refresh_token:result.data.session.refresh_token,expires_at:result.data.session.expires_at}:null}:{})},status:action==='signup'?201:200};
  }
  if(action==='recover') {const body=await input(ctx,recoverySchema);await authRate(ctx,body.email,'recover');const redirect=request.headers.get('x-client-platform')==='native'?nativeAuthRedirect(ctx.env):`${origin}/api/auth/callback?next=%2Fauth%3Fmode%3Dpassword`;await client.auth.resetPasswordForEmail(body.email,{redirectTo:redirect});return {value:{message:'If this email is registered, a recovery link will be sent.'}};}
  await authenticate(ctx);requireUser(ctx);await rate(ctx,'auth_mutation',10);
  if(action==='password') {const body=await input(ctx,passwordSchema);const result=await client.auth.updateUser(body);if(result.error)throw new ApiError(400,'AUTH_FAILED','The password could not be updated.');return {value:{updated:true}};}
  if(action==='logout') {await revokeSession(ctx);return {value:{signed_out:true}};}
  throw new ApiError(404,'NOT_FOUND','This API operation does not exist.');
}

async function studio(ctx:RequestContext,parts:string[]):Promise<{value:unknown;status?:number}> {
  const user=requireStaff(ctx);const [resource,record,operation]=parts;const {client,request}=ctx;const method=request.method;
  if(resource==='content') {
    if(!record&&method==='GET')return {value:database(await client.from('content').select('*,media_assets('+staffMediaColumns+')').order('updated_at',{ascending:false}).limit(100))};
    if(!record&&method==='POST')return {value:database(await client.from('content').insert({...await input(ctx,contentDraftSchema),created_by:user.id}).select().single()),status:201};
    if(record) {
      id(record);
      if(!operation&&method==='PATCH') {const body=await input(ctx,contentEditSchema);if(body.rights_verified!==undefined)requireFounder(ctx);return {value:database(await client.from('content').update(body).eq('id',record).select().single())};}
      if(operation==='transition'&&method==='POST') {const body=await input(ctx,transitionSchema);if(['approved','scheduled','published'].includes(body.state))requireFounder(ctx);return {value:database(await client.rpc('transition_content',{p_content_id:record,p_state:body.state,p_scheduled_at:body.scheduled_at??null}))};}
      if(operation==='rollback'&&method==='POST') {const body=await input(ctx,rollbackSchema);return {value:database(await client.rpc('rollback_content',{p_content_id:record,p_version:body.version}))};}
      if(operation==='versions'&&method==='GET')return {value:database(await client.from('content_versions').select('content_id,version,snapshot,created_by,created_at').eq('content_id',record).order('version',{ascending:false}).limit(100))};
    }
  }
  if(resource==='ideas'&&!record) {
    if(method==='GET')return {value:database(await client.from('studio_ideas').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100))};
    if(method==='POST'){const {ai_assisted,...body}=await input(ctx,ideaSchema);return {value:database(await client.from('studio_ideas').insert({...body,user_id:user.id,structured:{provenance:ai_assisted?'ai_assisted':'user_authored',review_required:ai_assisted}}).select().single()),status:201};}
  }
  if(resource==='audit'&&method==='GET'&&!record)return {value:database(await client.from('audit_events').select('id,actor_id,action,entity_type,entity_id,metadata,created_at').order('created_at',{ascending:false}).limit(100))};
  throw new ApiError(404,'NOT_FOUND','This Studio operation does not exist.');
}

async function media(ctx:RequestContext,record:string,operation:string|undefined):Promise<{value:unknown;status?:number}> {
  const {client,request}=ctx;
  if(record==='upload'&&request.method==='POST') {
    const user=requireStaff(ctx);await rate(ctx,'media_upload',5,3600);
    const type=request.headers.get('content-type');if(!type?.startsWith('multipart/form-data;'))throw new ApiError(415,'UNSUPPORTED_MEDIA_TYPE','Use a multipart recording upload.');
    const bytes=await readBoundedBytes(request,MAX_UPLOAD_BYTES+64*1024);
    let form:FormData;try{form=await new Request(request.url,{method:'POST',headers:{'content-type':type},body:bytes.buffer as ArrayBuffer}).formData();}catch{throw new ApiError(400,'INVALID_INPUT','The upload form could not be read.');}
    const file=form.get('file'),contentId=form.get('content_id'),rightsNotes=form.get('rights_notes');
    if(!(file instanceof File)||file.size<1||typeof contentId!=='string'||typeof rightsNotes!=='string'||!rightsNotes.trim()||rightsNotes.length>4000||[...form.keys()].some(key=>!['file','content_id','rights_notes'].includes(key)))throw new ApiError(400,'INVALID_INPUT','Provide a recording, content ID and rights notes.');
    id(contentId);
    const fileBytes=new Uint8Array(await file.arrayBuffer());const verified=verifyUpload(fileBytes,file.type,file.size);const mediaId=randomUUID(),storagePath=`${user.id}/${mediaId}.${verified.extension}`;
    database(await client.from('media_assets').insert({id:mediaId,owner_id:user.id,content_id:contentId,storage_path:storagePath,mime_type:verified.mime,byte_size:file.size,rights_notes:rightsNotes.trim(),rights_status:'pending',scan_status:'pending'}));
    const uploaded=await client.storage.from('recordings').upload(storagePath,fileBytes,{contentType:verified.mime,upsert:false});
    if(uploaded.error){await client.from('media_assets').delete().eq('id',mediaId).eq('owner_id',user.id);throw new ApiError(503,'UPLOAD_FAILED','The recording could not be stored. Try again.');}
    return {value:{id:mediaId,content_id:contentId,rights_status:'pending',scan_status:'pending',message:'The recording is quarantined until an operator completes scanning and the founder verifies rights.'},status:201};
  }
  id(record);
  if(!operation&&request.method==='PATCH') {requireStaff(ctx);const body=await input(ctx,mediaUpdateSchema);if(body.rights_status!==undefined||body.restricted!==undefined)requireFounder(ctx);if(!Object.keys(body).length)throw new ApiError(400,'INVALID_INPUT','Provide a media metadata change.');return {value:database(await client.from('media_assets').update(body).eq('id',record).select(staffMediaColumns).single())};}
  if(operation==='access'&&request.method==='GET') {
    if(ctx.user)await rate(ctx,'media_access',30);
    const asset=database<{id:string;storage_path:string;rights_status:string;scan_status:string}>(await client.from('media_assets').select('id,storage_path,rights_status,scan_status').eq('id',record).single());
    if(asset.scan_status!=='clean'||asset.rights_status!=='verified')throw new ApiError(403,'MEDIA_PENDING','The recording awaits completed scanning and verified rights.');
    const result=await client.storage.from('recordings').createSignedUrl(asset.storage_path,120);
    if(result.error||!result.data)throw new ApiError(403,'MEDIA_FORBIDDEN','This recording is not available to your account.');
    return {value:{url:result.data.signedUrl,expires_at:new Date(Date.now()+120_000).toISOString()}};
  }
  throw new ApiError(404,'NOT_FOUND','This media operation does not exist.');
}

async function ai(ctx:RequestContext):Promise<{value:unknown}> {
  const user=requireUser(ctx);const body=await input(ctx,aiSchema);await rate(ctx,'ai',5);
  const founderTask=['idea.organize','founder.draft','copy.adapt','transcript.summarize'].includes(body.task);
  if(founderTask)requireStaff(ctx);
  const preferences=database<{ai_enabled:boolean}>(await ctx.client.from('preferences').select('ai_enabled').eq('user_id',user.id).single());
  const consents=database(await ctx.client.from('consents').select('purpose,granted').eq('user_id',user.id));
  const consent=preferences?.ai_enabled===true&&consents.some(row=>row.purpose==='ai_processing'&&row.granted===true);
  if(!consent)throw new ApiError(403,'CONSENT_REQUIRED','Enable optional AI and grant processing consent in preferences.');
  const router=inferenceRouter(ctx.env);
  if(!router)return {value:{ok:false,error:{code:'UNAVAILABLE',message:'AI assistance is not configured. Your manual work is available.'},manualFallback:true}};
  let contentQuery=ctx.client.from('content').select('id,title,body,state,created_by').eq('state','published').eq('rights_verified',true).eq('founder_approved',true).neq('provenance','placeholder');
  const rawInput=body.input as Record<string,unknown>|null;
  const selectedIds=rawInput&&typeof rawInput==='object'?(rawInput.sourceIds??rawInput.contentIds):undefined;
  if(Array.isArray(selectedIds)&&selectedIds.every(value=>typeof value==='string'&&uuidSchema.safeParse(value).success)&&selectedIds.length<=20)contentQuery=contentQuery.in('id',selectedIds);
  const rows=database(await contentQuery.limit(20));
  const sources:AuthorizedSource[]=[];let size=0;
  for(const row of rows){const text=String(row.body).slice(0,Math.min(12000,50000-size));if(!text)continue;sources.push({id:row.id,title:row.title,text,visibility:'published'});size+=text.length;if(size>=50000)break;}
  const task=database<{id:string}>(await ctx.client.from('ai_tasks').insert({user_id:user.id,task:body.task,status:'pending',provider:ctx.env.AI_MODE==='oracle'?'oracle':'mock',trace_id:ctx.traceId}).select('id').single());
  const result=await router.runTask({task:body.task,input:body.input,context:{requesterId:user.id,roles:[ctx.role??'member'],consent,authorizedSources:sources},signal:ctx.request.signal});
  // Only task metadata is persisted; drafts/reflections and model output remain unchanged.
  if(task)database(await ctx.client.from('ai_tasks').update({status:result.ok?'completed':'failed',provider:result.ok?result.source:ctx.env.AI_MODE==='oracle'?'oracle':'mock'}).eq('id',task.id).eq('user_id',user.id));
  return {value:result};
}

async function route(ctx:RequestContext,parts:string[]):Promise<{value:unknown;status?:number}|Response> {
  const {client,request}=ctx;const method=request.method;const [resource,record,operation]=parts;const url=new URL(request.url);
  if(resource==='auth')return authOperation(ctx,record);
  await authenticate(ctx);
  if(resource==='session'&&method==='GET')return {value:{user:ctx.user?{id:ctx.user.id,email:ctx.user.email}:null,role:ctx.role,configured:true,signup_enabled:ctx.env.AGE_POLICY_APPROVED==='true',features:{pathways:ctx.env.PATHWAYS_REVIEW_APPROVED==='true'},ai:{configured:(ctx.env.AI_MODE??'disabled')!=='disabled',mock:ctx.env.AI_MODE==='mock'}}};
  if(ctx.user)await rate(ctx,'api',120);
  if(resource==='content'&&method==='GET') {
    const editorialDetail=!!record&&(ctx.role==='founder'||ctx.role==='editor');
    let query=client.from('content').select(contentColumns);
    if(!editorialDetail)query=query.eq('state','published').eq('founder_approved',true).eq('rights_verified',true).neq('provenance','placeholder');
    if(record)query=query.eq('id',id(record));
    if(url.searchParams.get('slug')) {const slug=url.searchParams.get('slug')!;if(!/^[a-z0-9-]{1,160}$/.test(slug))throw new ApiError(400,'INVALID_INPUT','Provide a valid content slug.');query=query.eq('slug',slug);}
    const search=url.searchParams.get('q');if(search) {if(search.length>240)throw new ApiError(400,'INVALID_INPUT','Search is limited to 240 characters.');query=query.ilike('title',`%${search.replace(/[\\%_]/g,'\\$&')}%`);}
    const rows=database(await query.order('published_at',{ascending:false}).limit(100)) as Record<string,unknown>[];
    if(record){if(!rows[0])throw new ApiError(404,'NOT_FOUND','This content is not available.');let mediaQuery=client.from('media_assets').select(editorialDetail?staffMediaColumns:mediaColumns).eq('content_id',record);if(!editorialDetail)mediaQuery=mediaQuery.eq('scan_status','clean').eq('rights_status','verified');const media=database(await mediaQuery);return {value:{...rows[0],media}};}
    return {value:rows};
  }
  if(resource==='media'&&operation==='access'&&method==='GET')return media(ctx,record,operation);
  const user=requireUser(ctx);
  if(method!=='GET')await rate(ctx,'mutation',30);
  if(resource==='profile') {
    if(method==='GET')return {value:database(await client.from('profiles').select('id,display_name,onboarding_completed_at,created_at').eq('id',user.id).single())};
    if(method==='PATCH'){const {onboarding_completed,...body}=await input(ctx,profileSchema);return {value:database(await client.from('profiles').update({...body,...(onboarding_completed!==undefined?{onboarding_completed_at:onboarding_completed?new Date().toISOString():null}:{})}).eq('id',user.id).select('id,display_name,onboarding_completed_at,created_at').single())};}
  }
  if(resource==='preferences') {
    if(method==='GET')return {value:database(await client.from('preferences').select('*').eq('user_id',user.id).single())};
    if(method==='PUT')return {value:database(await client.from('preferences').update(await input(ctx,preferencesSchema)).eq('user_id',user.id).select().single())};
  }
  if(resource==='consents') {
    if(method==='GET')return {value:database(await client.from('consents').select('purpose,granted,updated_at').eq('user_id',user.id))};
    if(method==='PUT') {const body=await input(ctx,consentSchema);database(await client.from('consents').upsert({...body,user_id:user.id},{onConflict:'user_id,purpose',ignoreDuplicates:true}));return {value:database(await client.from('consents').update({granted:body.granted}).eq('user_id',user.id).eq('purpose',body.purpose).select('purpose,granted,updated_at').single())};}
  }
  if(resource==='reflections') {
    if(!record&&method==='GET')return {value:database(await client.from('reflections').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100))};
    if(!record&&method==='POST')return {value:database(await client.from('reflections').insert({...await input(ctx,reflectionSchema),user_id:user.id}).select().single()),status:201};
    if(record&&method==='PATCH')return {value:database(await client.from('reflections').update(await input(ctx,reflectionSchema)).eq('id',id(record)).eq('user_id',user.id).select().single())};
    if(record&&method==='DELETE'){const rows=database(await client.from('reflections').delete().eq('id',id(record)).eq('user_id',user.id).select('id'));if(!rows?.length)throw new ApiError(404,'NOT_FOUND','The reflection is not available.');return {value:{deleted:true}};}
  }
  if(resource==='export'&&method==='GET') {
    await rate(ctx,'export',3,3600);
    const tables=['profiles','preferences','consents','reflections','bookmarks','playback_progress','pathway_progress'];
    const output:Record<string,unknown>={exported_at:new Date().toISOString(),format_version:1};
    for(const table of tables){const rows:unknown[]=[];for(let offset=0;offset<=10000;offset+=500){const page=database(await client.from(table).select('*').eq(table==='profiles'?'id':'user_id',user.id).range(offset,offset+499));rows.push(...page);if(rows.length>10000)throw new ApiError(413,'EXPORT_TOO_LARGE','Contact the operator for a complete large-account export.');if(page.length<500)break;}output[table]=rows;}
    return {value:output};
  }
  if(resource==='bookmarks') {
    if(!record&&method==='GET')return {value:database(await client.from('bookmarks').select('content_id,created_at,content('+contentColumns+')').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100))};
    if(!record&&method==='POST')return {value:database(await client.from('bookmarks').upsert({...await input(ctx,bookmarkSchema),user_id:user.id},{onConflict:'user_id,content_id'}).select().single()),status:201};
    if(record&&method==='DELETE'){database(await client.from('bookmarks').delete().eq('content_id',id(record)).eq('user_id',user.id));return {value:{deleted:true}};}
  }
  if(resource==='playback') {
    if(method==='GET')return {value:database(await client.from('playback_progress').select('*').eq('user_id',user.id).limit(100))};
    if(method==='PUT')return {value:database(await client.from('playback_progress').upsert({...await input(ctx,playbackSchema),user_id:user.id},{onConflict:'user_id,content_id'}).select().single())};
  }
  if(resource==='pathways'||resource==='progress') {
    if(ctx.env.PATHWAYS_REVIEW_APPROVED!=='true')throw new ApiError(403,'REVIEW_PENDING','Pathways await owner review.');
    if(resource==='pathways'&&method==='GET') {
      const pathways=database(await client.from('pathways').select('id,title,description,pathway_items(content_id,position,content('+contentColumns+'))').eq('published',true).order('position',{referencedTable:'pathway_items',ascending:true}).limit(100).returns<{id:string;title:string;description:string;pathway_items:Record<string,unknown>[]}[]>());
      const progress=database(await client.from('pathway_progress').select('pathway_id,content_id').eq('user_id',user.id).limit(1000));
      return {value:pathways.map(pathway=>({...pathway,completed_content_ids:progress.filter(row=>row.pathway_id===pathway.id).map(row=>row.content_id)}))};
    }
    if(resource==='progress'&&method==='PUT'){const {completed,...body}=await input(ctx,progressSchema);if(!completed){database(await client.from('pathway_progress').delete().eq('user_id',user.id).eq('pathway_id',body.pathway_id).eq('content_id',body.content_id));return {value:{completed:false}};}return {value:database(await client.from('pathway_progress').upsert({...body,user_id:user.id},{onConflict:'user_id,pathway_id,content_id'}).select().single())};}
  }
  if(resource==='account'&&method==='DELETE') {
    await input(ctx,accountDeletionSchema);await rate(ctx,'account_delete',2,3600);
    if(ctx.role==='founder'||ctx.role==='editor')throw new ApiError(409,'EDITORIAL_OWNERSHIP_REVIEW_REQUIRED','Transfer editorial ownership with the operator before deleting this account.');
    // Remove objects while their metadata still authorizes the owned deletion; failure prevents a partial account purge.
    const media=database(await client.from('media_assets').select('storage_path').eq('owner_id',user.id));
    if(media.length){const {error}=await client.storage.from('recordings').remove(media.map(row=>row.storage_path));if(error)throw new ApiError(409,'ACCOUNT_MEDIA_REVIEW_REQUIRED','Published recordings need an operator review before account deletion.');}
    database(await client.rpc('delete_own_account'));await client.auth.signOut({scope:'global'});return {value:{deleted:true}};
  }
  if(resource==='studio')return studio(ctx,parts.slice(1));
  if(resource==='media')return media(ctx,record,operation);
  if(resource==='ai'&&method==='POST')return ai(ctx);
  throw new ApiError(404,'NOT_FOUND','This API operation does not exist.');
}

export function createApiHandler(options:HandlerOptions={}) {
  return async(request:Request):Promise<Response>=>{
    const traceId=randomUUID(),started=Date.now(),cookies:PendingCookie[]=[];
    const env=options.environment??process.env;
    const url=new URL(request.url),parts=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean);
    let response:Response;
    try {
      if(!['GET','HEAD'].includes(request.method))assertMutationOrigin(request,env.APP_ORIGIN);
      if(parts.length===1&&parts[0]==='health'&&request.method==='GET')response=Response.json({data:{status:'ok',configured:!!serviceConfiguration(env),community_enabled:false}});
      else if(parts.length===1&&parts[0]==='session'&&request.method==='GET'&&!serviceConfiguration(env))response=Response.json({data:{user:null,role:null,configured:false,signup_enabled:false,features:{pathways:false},ai:{configured:false,mock:false}}});
      else {
        const client=(options.clientFactory??createRequestClient)(request,env,cookies);
        const result=await route({request,env,client,user:null,role:null,traceId},parts);
        response=result instanceof Response?result:Response.json({data:result.value},{status:result.status??200});
      }
    }catch(error){const failure=error instanceof ApiError?error:new ApiError(500,'INTERNAL_ERROR','The request could not be completed.');response=Response.json({error:{code:failure.code,message:failure.message},traceId},{status:failure.status});if(failure.status===429)response.headers.set('retry-after','60');}
    // Response.redirect has immutable headers: clone before adding refreshed session cookies and security metadata.
    response=new Response(response.body,{status:response.status,statusText:response.statusText,headers:response.headers});
    response.headers.set('cache-control','private, no-store');response.headers.set('x-trace-id',traceId);response.headers.set('x-content-type-options','nosniff');
    if(parts[0]==='export'&&response.ok)response.headers.set('content-disposition','attachment; filename="adequate-export.json"');
    appendCookies(response,cookies);
    options.logger?.({traceId,method:request.method,operation:parts[0]??'unknown',status:response.status,duration_ms:Date.now()-started});
    return response;
  };
}
