import {createClient} from '@supabase/supabase-js';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const run=promisify(execFile);
export async function scanWithClamAV(path,command='clamscan'){
 try{await run(command,['--no-summary','--infected',path],{timeout:90000,maxBuffer:64*1024});return 'clean';}
 catch(error){return error.code===1?'rejected':'pending';}
}
export async function scanRecordings(db,{command='clamscan',limit=5}={}){
 const result=await db.from('media_assets').select('id,storage_path,byte_size').eq('scan_status','pending').limit(limit);
 if(result.error)throw new Error('Scanner queue unavailable');
 const summary={clean:0,rejected:0,pending:0};
 for(const item of result.data||[]){
  const folder=await mkdtemp(join(tmpdir(),'adequate-scan-'));
  try{
   if(item.byte_size>50*1024*1024||item.byte_size<1){summary.pending++;continue;}
   const download=await db.storage.from('recordings').download(item.storage_path);
   if(download.error||download.data.size!==item.byte_size){summary.pending++;continue;}
   const path=join(folder,'recording');await writeFile(path,new Uint8Array(await download.data.arrayBuffer()),{mode:0o600});
   const status=await scanWithClamAV(path,command);
   if(status!=='pending'){
    const update=await db.from('media_assets').update({scan_status:status}).eq('id',item.id).eq('scan_status','pending');
    if(update.error){summary.pending++;continue;}
   }
   summary[status]++;
  }finally{await rm(folder,{recursive:true,force:true});}
 }
 return summary;
}
if(import.meta.url===new URL(process.argv[1],'file://').href){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Server-only confirmed target configuration is required.');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await scanRecordings(db,{command:process.env.CLAMAV_COMMAND||'clamscan'});console.log(JSON.stringify({event:'recording_scan',...result}));if(result.pending)process.exitCode=1;
}
