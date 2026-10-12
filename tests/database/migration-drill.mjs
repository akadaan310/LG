import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
const container=process.env.ADEQUATE_DB_CONTAINER ?? 'supabase_db_LG';
const database='adequate_migration_drill';
function sql(statement,db=database) {
 return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1'],{input:statement,encoding:'utf8',maxBuffer:10*1024*1024,stdio:['pipe','pipe','pipe']});
}
sql(`create database ${database};`,'postgres');
try {
 const schema=execFileSync('docker',['exec',container,'pg_dump','-U','postgres','-d','postgres','--schema-only'],{encoding:'utf8',maxBuffer:10*1024*1024});
 sql(schema);
 sql(readFileSync('supabase/rollback/operational_foundation.sql','utf8'));
 console.log('PASS: foundation rollback on disposable database');
 for(const file of readdirSync('supabase/migrations').filter(file=>file.endsWith('.sql')).sort()) {
  sql(readFileSync(`supabase/migrations/${file}`,'utf8'));
  console.log(`PASS: reapplied ${file}`);
 }
 sql(readFileSync('tests/database/security.sql','utf8'));
 console.log('PASS: all security scenarios after rollback and complete reapply');
} finally {
 sql(`drop database ${database} with (force);`,'postgres');
}
