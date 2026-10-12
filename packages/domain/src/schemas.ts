import { z } from 'zod';

export const contentStates = ['draft','review','approved','scheduled','published','archived'] as const;
export const contentKinds = ['home','story','principle','essay','audio','membership'] as const;
export const provenanceKinds = ['founder_original','user_authored','ai_assisted','placeholder'] as const;
export const roleSchema = z.enum(['member','editor','founder']);
export type Role = z.infer<typeof roleSchema>;
export const uuidSchema = z.uuid();
export const reflectionSchema = z.object({ body:z.string().trim().min(1).max(20000) }).strict();
export const preferencesSchema = z.object({theme:z.enum(['system','dark','light']),ai_enabled:z.boolean()}).strict();
export const profileSchema = z.object({display_name:z.string().trim().max(100),onboarding_completed:z.boolean().optional()}).strict();
export const consentSchema = z.object({purpose:z.enum(['ai_processing','external_ai','analytics']),granted:z.boolean()}).strict();
export const contentDraftSchema = z.object({
  title:z.string().trim().min(1).max(200),
  slug:z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  body:z.string().max(100000),
  kind:z.enum(contentKinds),
  audience:z.enum(['public','member']),
  provenance:z.enum(provenanceKinds),
}).strict();
export const contentEditSchema = contentDraftSchema.partial().extend({rights_verified:z.boolean().optional()}).strict();
export const transitionSchema = z.object({state:z.enum(contentStates),scheduled_at:z.iso.datetime().optional()}).strict();
export const rollbackSchema = z.object({version:z.number().int().positive()}).strict();
export const bookmarkSchema = z.object({content_id:uuidSchema}).strict();
export const playbackSchema = z.object({content_id:uuidSchema,position_seconds:z.number().finite().min(0).max(86400)}).strict();
export const authSchema = z.object({email:z.email().max(254),password:z.string().min(12).max(128)}).strict();
export const chaptersSchema = z.array(z.object({title:z.string().trim().min(1).max(200),start_seconds:z.number().min(0).max(86400)}).strict()).max(200);
export const mediaUpdateSchema = z.object({rights_status:z.enum(['pending','verified','rejected']).optional(),rights_notes:z.string().max(4000).optional(),transcript:z.string().max(100000).optional(),chapters:chaptersSchema.optional(),restricted:z.boolean().optional()}).strict();
export const progressSchema = z.object({pathway_id:uuidSchema,content_id:uuidSchema,completed:z.boolean()}).strict();
export const ideaSchema = z.object({body:z.string().trim().min(1).max(20000),ai_assisted:z.boolean().default(false)}).strict();
export const accountDeletionSchema = z.object({confirmation:z.literal('DELETE')}).strict();

export type ReflectionInput = z.infer<typeof reflectionSchema>;
export type ContentDraft = z.infer<typeof contentDraftSchema>;
export type ContentState = typeof contentStates[number];
export interface Content extends ContentDraft {
  id:string; state:ContentState; version:number; created_by:string;
  rights_verified:boolean; founder_approved:boolean; published_at:string|null; scheduled_at:string|null; updated_at:string;
}
export interface Reflection {id:string;user_id:string;body:string;structured:unknown;created_at:string;updated_at:string}
export type ApiResponse<T> = {data:T}|{error:{code:string;message:string};traceId:string};

// Database policy remains authoritative. This helper guides forms and validates intended edges.
export function mayTransition(from:ContentState,to:ContentState,role:Role):boolean {
  if(role==='member') return false;
  const edges:Record<ContentState,ContentState[]>={draft:['review'],review:['draft','approved'],approved:['draft','scheduled','published'],scheduled:['draft','published'],published:['draft','archived'],archived:['draft']};
  if(!edges[from].includes(to)) return false;
  if(['scheduled','published'].includes(from)&&role!=='founder') return false;
  return !['approved','scheduled','published','archived'].includes(to) || role==='founder';
}
