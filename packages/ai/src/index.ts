import { z } from 'zod';

const text = z.string().trim().min(1).max(20_000);
const short = z.string().trim().min(1).max(240);
const id = z.string().trim().min(1).max(160);
const section = z.object({ heading: short, text }).strict();
export const taskContracts = {
  'reflection.structure': { input: z.object({ text }).strict(), output: z.object({ title: short, sections: z.array(section).min(1).max(12) }).strict() },
  'idea.organize': { input: z.object({ text }).strict(), output: z.object({ title: short, summary: text, tags: z.array(short).max(8) }).strict() },
  'content.discover': { input: z.object({ query: z.string().trim().max(240), limit: z.number().int().min(1).max(20).default(10) }).strict(), output: z.object({ items: z.array(z.object({ id, title: short, reason: short }).strict()).max(20) }).strict() },
  'founder.draft': { input: z.object({ brief: text, sourceIds: z.array(id).max(20).optional() }).strict(), output: z.object({ draft: text, reviewRequired: z.literal(true) }).strict() },
  'copy.adapt': { input: z.object({ text, format: z.enum(['short', 'plain', 'outline']) }).strict(), output: z.object({ draft: text, reviewRequired: z.literal(true) }).strict() },
  'transcript.summarize': { input: z.object({ transcript: text }).strict(), output: z.object({ summary: text, chapters: z.array(z.object({ title: short, startSeconds: z.number().nonnegative().optional() }).strict()).max(40) }).strict() },
  'recommendation.explain': { input: z.object({ contentIds: z.array(id).min(1).max(20) }).strict(), output: z.object({ explanation: text, sourceIds: z.array(id).min(1).max(20) }).strict() },
} as const;
export type TaskName = keyof typeof taskContracts;
export type TaskInput<T extends TaskName> = z.input<(typeof taskContracts)[T]['input']>;
export type TaskOutput<T extends TaskName> = z.output<(typeof taskContracts)[T]['output']>;
const sourceSchema = z.object({ id, title: short.optional(), text: z.string().max(12_000), visibility: z.enum(['published', 'private']), ownerId: id.optional() }).strict();
export type AuthorizedSource = z.infer<typeof sourceSchema>;
/** Server constructed from authenticated, active user + stored consent + RLS-scoped sources. Never accept this context from a client body. */
export interface TaskContext { requesterId: string; roles: readonly ('member' | 'editor' | 'founder')[]; consent: boolean; authorizedSources: readonly AuthorizedSource[] }
export interface TaskRequest<T extends TaskName = TaskName> { task: T; input: unknown; context: TaskContext; signal?: AbortSignal }
export type TaskErrorCode = 'CONSENT_REQUIRED' | 'ROLE_REQUIRED' | 'SOURCE_FORBIDDEN' | 'INVALID_INPUT' | 'INVALID_OUTPUT' | 'TIMEOUT' | 'CANCELLED' | 'BUSY' | 'CIRCUIT_OPEN' | 'UNAVAILABLE';
export type TaskResult<T extends TaskName = TaskName> =
 | { ok: true; task: T; output: TaskOutput<T>; source: 'mock' | 'oracle' | 'deterministic'; label: string; modelVersion?: string; error?: never; manualFallback?: false }
 | { ok: false; error: { code: TaskErrorCode; message: string }; manualFallback: true; output?: never; source?: never; label?: never };
export interface AdapterRequest { task: TaskName; input: Record<string, unknown>; sources: AuthorizedSource[] }
export interface AdapterResponse { output: unknown; source: 'mock' | 'oracle'; modelVersion?: string }
/** Adapters generate proposals only; they receive no database, credentials, publish hooks or tools. */
export interface TaskAdapter { kind: 'mock' | 'oracle'; generate(request: AdapterRequest, signal: AbortSignal): Promise<AdapterResponse> }
class TaskFailure extends Error { code: TaskErrorCode; constructor(code: TaskErrorCode) { super(code); this.code = code; } }
const messages: Record<TaskErrorCode, string> = {
 CONSENT_REQUIRED: 'Optional AI assistance needs your consent.', ROLE_REQUIRED: 'This task needs an authorized editorial role.', SOURCE_FORBIDDEN: 'Source material is not authorized for this requester.',
 INVALID_INPUT: 'Check the task input and try again.', INVALID_OUTPUT: 'The generated proposal did not pass validation.', TIMEOUT: 'AI assistance timed out. Your manual work is available.', CANCELLED: 'AI assistance was cancelled.', BUSY: 'AI assistance is busy. Your manual work is available.', CIRCUIT_OPEN: 'AI assistance is temporarily unavailable.', UNAVAILABLE: 'AI assistance is unavailable. Your manual work is available.',
};
function failure(code: TaskErrorCode): TaskResult<never> { return { ok: false, error: { code, message: messages[code] }, manualFallback: true }; }

export function mockOutput(request: AdapterRequest): unknown {
 const input = request.input;
 switch (request.task) {
  case 'reflection.structure': return { title: 'Your reflection (mock structure)', sections: [{ heading: 'Your words', text: input.text }] };
  case 'idea.organize': return { title: 'Idea proposal (mock)', summary: input.text, tags: [] };
  case 'founder.draft': return { draft: `Mock draft placeholder for review: ${String(input.brief).slice(0, 19_800)}`, reviewRequired: true };
  case 'copy.adapt': return { draft: input.text, reviewRequired: true };
  case 'transcript.summarize': return { summary: `Mock summary placeholder; review the supplied transcript: ${String(input.transcript).slice(0, 19_800)}`, chapters: [] };
  case 'recommendation.explain': return { explanation: 'Mock explanation: these items match the explicitly selected authorized source IDs. No personal worth or emotional assessment is performed.', sourceIds: input.contentIds };
  case 'content.discover': return discover(input, request.sources);
 }
}
export function createMockAdapter(): TaskAdapter { return { kind: 'mock', async generate(request) { return { output: mockOutput(request), source: 'mock', modelVersion: 'local-mock-v1' }; } }; }
function discover(input: Record<string, unknown>, sources: AuthorizedSource[]) {
 const words = String(input.query).toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const items = sources.map(source => ({ source, score: words.filter(word => `${source.title ?? ''} ${source.text}`.toLocaleLowerCase().includes(word)).length }))
  .filter(item => !words.length || item.score > 0).sort((a,b) => b.score-a.score)
  .slice(0, Number(input.limit ?? 10)).map(({source}) => ({ id: source.id, title: source.title ?? 'Authorized content', reason: words.length ? 'Matches your search terms.' : 'Available authorized content.' }));
 return {items};
}

export interface RouterOptions { adapter?: TaskAdapter; timeoutMs?: number; maxConcurrent?: number; maxQueued?: number; failureThreshold?: number; resetAfterMs?: number }
export function createTaskRouter(options: RouterOptions = {}) {
 const adapter = options.adapter ?? createMockAdapter();
 const timeoutMs = options.timeoutMs ?? 15_000, maxConcurrent = options.maxConcurrent ?? 1, maxQueued = options.maxQueued ?? 8;
 const threshold = options.failureThreshold ?? 3, resetAfterMs = options.resetAfterMs ?? 30_000;
 for (const value of [timeoutMs,maxConcurrent,threshold,resetAfterMs]) if (!Number.isInteger(value) || value < 1) throw new Error('Router bounds must be positive integers');
 if (!Number.isInteger(maxQueued) || maxQueued < 0) throw new Error('Queue bound must be nonnegative');
 let active = 0, failures = 0, openedAt = 0;
 const queue: Array<{ grant: () => void; reject: (error: TaskFailure) => void; signal: AbortSignal; cleanup: () => void }> = [];
 function release() { active--; while(queue.length) { const next=queue.shift()!; next.cleanup(); if(!next.signal.aborted){active++;next.grant();break;} } }
 function acquire(signal: AbortSignal): Promise<void> {
  if(signal.aborted) return Promise.reject(signal.reason);
  if(active<maxConcurrent){active++;return Promise.resolve();}
  if(queue.length>=maxQueued) return Promise.reject(new TaskFailure('BUSY'));
  return new Promise((resolve,reject)=>{
   const entry={grant:resolve,reject,signal,cleanup:()=>signal.removeEventListener('abort',abort)};
   const abort=()=>{const index=queue.indexOf(entry);if(index>=0)queue.splice(index,1);reject(signal.reason);};
   queue.push(entry);signal.addEventListener('abort',abort,{once:true});
  });
 }
 async function runTask<T extends TaskName>(request: TaskRequest<T>): Promise<TaskResult<T>> {
  if (!Object.hasOwn(taskContracts, request.task)) return failure('INVALID_INPUT');
  const contract=taskContracts[request.task];
  if(!contract) return failure('INVALID_INPUT');
  const context=request.context;
  if(!context || context.consent!==true) return failure('CONSENT_REQUIRED');
  if(!id.safeParse(context.requesterId).success || !Array.isArray(context.roles) || !context.roles.some(role=>['member','editor','founder'].includes(role))) return failure('ROLE_REQUIRED');
  if(['idea.organize','founder.draft','copy.adapt','transcript.summarize'].includes(request.task) && !context.roles.some(role=>role==='editor'||role==='founder')) return failure('ROLE_REQUIRED');
  const parsed=contract.input.safeParse(request.input); if(!parsed.success) return failure('INVALID_INPUT');
  const sourceResult=z.array(sourceSchema).max(40).safeParse(context.authorizedSources); if(!sourceResult.success) return failure('SOURCE_FORBIDDEN');
  const sources=sourceResult.data;
  if(sources.some(source=>source.visibility==='private'&&source.ownerId!==context.requesterId)||sources.reduce((size,source)=>size+source.text.length,0)>50_000) return failure('SOURCE_FORBIDDEN');
  const authorizedIds=new Set(sources.map(source=>source.id));
  const input=parsed.data as Record<string,unknown>;
  for(const field of ['sourceIds','contentIds']) if(Array.isArray(input[field])&&(input[field] as string[]).some(value=>!authorizedIds.has(value)))return failure('SOURCE_FORBIDDEN');
  if(request.signal?.aborted)return failure('CANCELLED');
  if(request.task==='content.discover')return {ok:true,task:request.task,output:discover(input,sources) as TaskOutput<T>,source:'deterministic',label:'Deterministic search over authorized content'};
  if(openedAt && Date.now()-openedAt<resetAfterMs)return failure('CIRCUIT_OPEN');
  if(openedAt){openedAt=0;failures=0;}
  const controller=new AbortController();
  const cancel=()=>controller.abort(new TaskFailure('CANCELLED'));
  request.signal?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(()=>controller.abort(new TaskFailure('TIMEOUT')),timeoutMs);
  let abortListener:()=>void=()=>{};
  try {
   await acquire(controller.signal);
   const generation=Promise.resolve().then(()=>adapter.generate({task:request.task,input,sources},controller.signal));
   // A noncooperative adapter retains its slot until it settles; a deadline never creates unbounded underlying work.
   generation.then(release,release);
   const abort=new Promise<never>((_,reject)=>{abortListener=()=>reject(controller.signal.reason);if(controller.signal.aborted)abortListener();else controller.signal.addEventListener('abort',abortListener,{once:true});});
   const response=await Promise.race([generation,abort]);
   if(!response || !['mock','oracle'].includes(response.source) || JSON.stringify(response.output).length>64_000)throw new TaskFailure('INVALID_OUTPUT');
   const output=contract.output.safeParse(response.output);if(!output.success)throw new TaskFailure('INVALID_OUTPUT');
   const refs=(output.data as {sourceIds?:string[]}).sourceIds;if(refs?.some(ref=>!authorizedIds.has(ref)))throw new TaskFailure('INVALID_OUTPUT');
   failures=0;
   return {ok:true,task:request.task,output:output.data as TaskOutput<T>,source:response.source,label:response.source==='mock'?'AI-assisted · mock (not LG-approved)':'AI-assisted · unapproved (not LG-approved)',modelVersion:response.modelVersion?.slice(0,128)};
  } catch(error) {
   const code=error instanceof TaskFailure?error.code:'UNAVAILABLE';
   if(['TIMEOUT','UNAVAILABLE','INVALID_OUTPUT'].includes(code)){failures++;if(failures>=threshold)openedAt=Date.now();}
   return failure(code);
  } finally {clearTimeout(timer);request.signal?.removeEventListener('abort',cancel);controller.signal.removeEventListener('abort',abortListener);}
 }
 return {runTask,getStats:()=>({active,queued:queue.length,circuitOpen:openedAt>0&&Date.now()-openedAt<resetAfterMs})};
}
const responseSchema=z.object({output:z.unknown(),source:z.enum(['mock','oracle']),modelVersion:z.string().max(128).optional()}).strict();
async function boundedJson(response:Response) {
 const reader=response.body?.getReader();if(!reader)throw new TaskFailure('INVALID_OUTPUT');
 const chunks:Uint8Array[]=[];let total=0;
 try {while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>64_000){await reader.cancel();throw new TaskFailure('INVALID_OUTPUT');}chunks.push(value);}}
 finally {reader.releaseLock();}
 const joined=new Uint8Array(total);let position=0;for(const chunk of chunks){joined.set(chunk,position);position+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(joined));}catch{throw new TaskFailure('INVALID_OUTPUT');}
}
/** Fixed private TLS endpoint only. No redirects, tools, remote-media fetch or external provider fallback. */
export function createRemoteAdapter(options:{endpoint:string;token:string;fetch?:typeof fetch}):TaskAdapter {
 const endpoint=new URL(options.endpoint);
 if(endpoint.protocol!=='https:')throw new Error('Inference endpoint requires HTTPS');
 if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error('Endpoint credentials, query and fragment are forbidden');
 if(!options.token || options.token.length>4096 || /[\r\n]/.test(options.token))throw new Error('A bounded service token is required');
 const fetcher=options.fetch??globalThis.fetch;
 return {kind:'oracle',async generate(request,signal){
  const response=await fetcher(endpoint.href,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${options.token}`},body:JSON.stringify(request),redirect:'error',signal});
  if(!response.ok)throw new TaskFailure('UNAVAILABLE');
  const parsed=responseSchema.safeParse(await boundedJson(response));if(!parsed.success)throw new TaskFailure('INVALID_OUTPUT');return parsed.data;
 }};
}
const defaultRouter=createTaskRouter();
/** Default explicitly mock server router. Supply a single private TLS adapter via createTaskRouter for authorized Oracle deployment. */
export const runTask=defaultRouter.runTask;
