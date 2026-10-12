import {readFileSync,writeFileSync} from 'node:fs';
if(process.env.ADEQUATE_DISPOSABLE_FIXTURES!=='true')throw new Error('Only enable synthetic signup fixtures in an isolated local test checkout.');
const file='supabase/config.toml';const text=readFileSync(file,'utf8');
writeFileSync(file,text.replaceAll('enable_signup = false','enable_signup = true'));
console.log('Disposable local Auth signup fixtures enabled; revert config after tests.');
