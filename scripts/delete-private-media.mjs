import {createClient} from '@supabase/supabase-js';
export async function processMediaDeletions(db){
 const {data:jobs,error}=await db.rpc('claim_media_deletions',{p_limit:20});
 if(error)throw new Error('Deletion queue unavailable');
 let completed=0,failed=0,blocked=0;
 for(const job of jobs||[]){
  if(job.status==='blocked_review'){blocked++;continue;}
  let errorCode=null;
  if(job.storage_paths?.length){const result=await db.storage.from('recordings').remove(job.storage_paths);if(result.error)errorCode='STORAGE_UNAVAILABLE';}
  const result=await db.rpc('complete_media_deletion',{p_job_id:job.id,p_error:errorCode});
  if(result.error||errorCode)failed++;else completed++;
 }
 return {completed,failed,blocked};
}
if(import.meta.url===new URL(process.argv[1],'file://').href){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Server-only confirmed target configuration is required.');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await processMediaDeletions(db);console.log(JSON.stringify({event:'media_deletion_jobs',...result}));if(result.failed)process.exitCode=1;
}
