import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {serviceConfiguration} from './lib/supabase';

export async function proxy(request:NextRequest) {
  let response=NextResponse.next({request});
  const service=serviceConfiguration(process.env);
  if(!service||request.headers.has('authorization'))return response;
  try {
    const client=createServerClient(service.url,service.key,{
      cookieOptions:{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/'},
      cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{for(const cookie of values)request.cookies.set(cookie.name,cookie.value);response=NextResponse.next({request});for(const cookie of values)response.cookies.set(cookie.name,cookie.value,cookie.options);}},
    });
    await client.auth.getUser();
  }catch{/* Route handlers report service failures using the API envelope. */}
  return response;
}
export const config={matcher:['/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)']};
