import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Server-only confirmed target configuration is required.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await db.rpc('publish_due_content');
if(error){console.error(JSON.stringify({event:'scheduler_failed',code:error.code||'UNAVAILABLE'}));process.exit(1);}
console.log(JSON.stringify({event:'scheduled_content_published',count:data}));
