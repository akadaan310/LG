import http from 'node:http';
// Local-only integration harness. Never deploy this unauthenticated HTTP proxy.
const routes=[['/auth/v1',54331],['/storage/v1',54332],['/rest/v1',54333]];
const server=http.createServer((req,res)=>{
 const route=routes.find(([prefix])=>req.url===prefix||req.url.startsWith(prefix+'/'));
 if(!route){res.writeHead(404,{'content-type':'application/json'});res.end('{"error":"unknown local service"}');return;}
 const [prefix,port]=route;
 const upstream=http.request({hostname:'127.0.0.1',port,path:req.url.slice(prefix.length)||'/',method:req.method,headers:{...req.headers,host:`127.0.0.1:${port}`}},response=>{
  res.writeHead(response.statusCode,response.headers);response.pipe(res);
 });
 upstream.on('error',()=>{if(!res.headersSent)res.writeHead(503);res.end('Local service unavailable');});
 req.pipe(upstream);
 req.on('aborted',()=>upstream.destroy());
});
server.listen(54321,'127.0.0.1',()=>console.log('Local integration proxy ready on 127.0.0.1:54321'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
