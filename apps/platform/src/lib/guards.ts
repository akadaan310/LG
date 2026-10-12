export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function bearerToken(request: Request): string | null {
  const value=request.headers.get('authorization');
  if(value===null) return null;
  if(!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) throw new ApiError(401,'INVALID_AUTHORIZATION','A valid bearer token is required.');
  return value.slice(7);
}
export function assertMutationOrigin(request: Request,expectedOrigin?:string): void {
  if(bearerToken(request)) return;
  const origin=request.headers.get('origin');
  const nativeInitialAuth=request.method==='POST'
    && /^\/api\/auth\/(?:login|signup|recover)$/.test(new URL(request.url).pathname)
    && request.headers.get('x-client-platform')==='native'
    && !request.headers.has('cookie')
    && origin===null
    && request.headers.get('sec-fetch-site')!=='cross-site'
    && request.headers.get('content-type')?.split(';')[0].trim()==='application/json';
  if(nativeInitialAuth)return;
  if(origin!==(expectedOrigin??new URL(request.url).origin) || request.headers.get('sec-fetch-site')==='cross-site') throw new ApiError(403,'CSRF_REJECTED','The request must originate from this application.');
}
export async function readBoundedBytes(request: Request,maxBytes:number):Promise<Uint8Array> {
  const length=request.headers.get('content-length');
  if(length && (!/^\d+$/.test(length) || Number(length)>maxBytes)) throw new ApiError(413,'BODY_TOO_LARGE','The request body is too large.');
  if(!request.body) return new Uint8Array();
  const reader=request.body.getReader(); const chunks:Uint8Array[]=[]; let size=0;
  try {
    while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>maxBytes) {await reader.cancel(); throw new ApiError(413,'BODY_TOO_LARGE','The request body is too large.');} chunks.push(value); }
  } finally {reader.releaseLock();}
  const output=new Uint8Array(size); let offset=0; for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}return output;
}
export async function readBoundedJson(request: Request, maxBytes = 256_000): Promise<unknown> {
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json') throw new ApiError(415,'UNSUPPORTED_MEDIA_TYPE','Use application/json.');
  const bytes=await readBoundedBytes(request,maxBytes);
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new ApiError(400,'INVALID_JSON','Provide a valid JSON body.');}
}
export function safeRedirect(value: string | null): string {
  if(!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value) || /%2f|%5c/i.test(value) || value.startsWith('/api/')) return '/today';
  try {const url=new URL(value,'https://adequate.invalid'); return url.origin==='https://adequate.invalid'?`${url.pathname}${url.search}`:'/today';}catch{return '/today';}
}
export const MAX_UPLOAD_BYTES=25*1024*1024;
export function verifyUpload(bytes: Uint8Array, type: string, size: number): {extension: string; mime: string} {
  if(size>MAX_UPLOAD_BYTES) throw new ApiError(413,'BODY_TOO_LARGE','Recordings must be at most 25 MB.');
  const header=new TextDecoder('ascii').decode(bytes.slice(0,16));
  const mp3=header.startsWith('ID3') || (bytes.length>=2 && bytes[0]===0xff && (bytes[1]&0xe0)===0xe0);
  const wav=header.startsWith('RIFF') && header.slice(8,12)==='WAVE';
  const ogg=header.startsWith('OggS');
  const m4a=header.slice(4,8)==='ftyp' && ['M4A ','M4B ','isom','mp42'].some(brand=>header.slice(8,12)===brand);
  if(type==='audio/mpeg' && mp3) return {extension:'mp3',mime:type};
  if(['audio/wav','audio/x-wav'].includes(type) && wav) return {extension:'wav',mime:'audio/wav'};
  if(type==='audio/ogg' && ogg) return {extension:'ogg',mime:type};
  if(['audio/mp4','audio/x-m4a'].includes(type) && m4a) return {extension:'m4a',mime:'audio/mp4'};
  throw new ApiError(415,'UNSUPPORTED_MEDIA_TYPE','Upload an MP3, WAV, Ogg or M4A recording with a matching file signature.');
}
