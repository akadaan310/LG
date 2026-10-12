import {createApiHandler} from '@/lib/api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const handler=createApiHandler({logger:entry=>console.info(JSON.stringify({event:'api_request',...entry}))});
export const GET=handler;
export const POST=handler;
export const PUT=handler;
export const PATCH=handler;
export const DELETE=handler;
