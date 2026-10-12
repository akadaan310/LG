export function parseLocalEnvironment(text){
 return Object.fromEntries(text.split(/\r?\n/).filter(line=>line.trim()&&!line.trimStart().startsWith('#')).map(line=>{
  const at=line.indexOf('=');if(at<1)throw new Error('Invalid local environment entry');
  const key=line.slice(0,at).trim();let value=line.slice(at+1).trim();
  if(value.length>=2&&((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'"))))value=value.slice(1,-1);
  return [key,value];
 }));
}
