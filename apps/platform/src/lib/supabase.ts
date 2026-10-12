import {createServerClient,parseCookieHeader,serializeCookieHeader,type CookieOptions} from '@supabase/ssr';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {ApiError,bearerToken} from './guards';

export type Environment=Record<string,string|undefined>;
export interface PendingCookie {name:string;value:string;options:CookieOptions}
export function isPublicKey(key:string):boolean {
  if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))return true;
  if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key))return false;
  try{return JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString('utf8')).role==='anon';}catch{return false;}
}
export function serviceConfiguration(env:Environment) {
  const url=env.NEXT_PUBLIC_SUPABASE_URL;
  const key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key||!isPublicKey(key))return null;
  try{const parsed=new URL(url);if(parsed.username||parsed.password||!(parsed.protocol==='https:'||(parsed.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(parsed.hostname))))return null;return {url,key};}catch{return null;}
}
export function createRequestClient(request:Request,env:Environment,cookies:PendingCookie[]):SupabaseClient {
  const config=serviceConfiguration(env);
  if(!config)throw new ApiError(503,'SERVICE_UNAVAILABLE','Account services are not configured.');
  const token=bearerToken(request);
  if(token)return createClient(config.url,config.key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  if(request.headers.get('x-client-platform')==='native')return createClient(config.url,config.key,{auth:{flowType:'implicit',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  return createServerClient(config.url,config.key,{
    cookies:{getAll:()=>parseCookieHeader(request.headers.get('cookie')??'').map(cookie=>({...cookie,value:cookie.value??''})),setAll:values=>{cookies.push(...values);}},
    cookieOptions:{httpOnly:true,sameSite:'lax',secure:new URL(request.url).protocol==='https:',path:'/'},
  });
}
export function appendCookies(response:Response,cookies:PendingCookie[]):Response {
  for(const cookie of cookies)response.headers.append('set-cookie',serializeCookieHeader(cookie.name,cookie.value,cookie.options));
  return response;
}
/** This privileged client is exclusively for a hashed anonymous rate counter RPC. Never query account/content tables with it. */
export function createAuthRateClient(env:Environment):SupabaseClient|null {
  const config=serviceConfiguration(env);const key=env.SUPABASE_SERVICE_ROLE_KEY;
  return config&&key?createClient(config.url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}
