import { randomBytes, createHmac } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const secret = randomBytes(48).toString('hex');
function jwt(role) {
 const h = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const p = Buffer.from(JSON.stringify({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400*7})).toString('base64url');
 return `${h}.${p}.${createHmac('sha256',secret).update(`${h}.${p}`).digest('base64url')}`;
}
writeFileSync('/tmp/adequate-local.env',`JWT_SECRET=${secret}\nANON_KEY=${jwt('anon')}\nSERVICE_ROLE_KEY=${jwt('service_role')}\nDATABASE_URL=postgres://postgres:adequate-local-only@127.0.0.1:54322/postgres\n`,{mode:0o600});
console.log('Local credentials written to /tmp/adequate-local.env (not printed).');
