import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const issues=[];
for(const file of files){
 if(/\.(png|woff2?|ttf|otf|jpg|jpeg|mp3|wav|lock)$/.test(file)||file.endsWith('package-lock.json'))continue;
 const data=readFileSync(file,'utf8');
 if(/^(apps\/platform|apps\/mobile)\/src\//.test(file)&&data.includes('@adequate/mock-content')) issues.push(`${file}: product imports prototype content`);
 if(/NEXT_PUBLIC_\w*(SERVICE_ROLE|SECRET)|EXPO_PUBLIC_\w*(SERVICE_ROLE|SECRET)/.test(data)) issues.push(`${file}: public secret variable`);
 if(/sb_secret_[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(data)) issues.push(`${file}: credential pattern`);
}
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log(`Source guard checked ${files.length} tracked/unignored files: no prototype content imports or public credential patterns.`);
