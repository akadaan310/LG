import type { Reflection } from "@adequate/domain";
export interface ContentRow {
  id: string;
  title: string;
  slug: string;
  body: string;
  kind: string;
  provenance: string;
  state: string;
  media?: MediaRow[];
}
export interface MediaRow {
  id: string;
  content_id: string;
  rights_status: string;
  scan_status?: string;
  transcript: string;
  chapters: { title: string; start_seconds: number }[];
  mime_type: string;
}
export interface Preferences {
  theme: "system" | "light" | "dark";
  ai_enabled: boolean;
}
export interface Consent {
  purpose: "ai_processing" | "external_ai" | "analytics";
  granted: boolean;
}
export interface Bookmark {
  content_id: string;
  content: ContentRow | null;
  created_at: string;
}
export interface Playback {
  content_id: string;
  position_seconds: number;
}
export interface SessionInfo {
  configured: boolean;
  signup_enabled: boolean;
  user: { id: string; email: string } | null;
  features: { pathways: boolean };
}
export interface MemberData {
  content: ContentRow[];
  reflections: Reflection[];
  bookmarks: Bookmark[];
  preferences: Preferences;
  consents: Consent[];
  playback: Playback[];
  profile: { display_name: string; onboarding_completed_at: string | null };
  session: SessionInfo;
}
