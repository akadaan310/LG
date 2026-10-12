import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, processLock } from "@supabase/supabase-js";
import {
  createApiClient,
  createChunkStorage,
  DraftRepository,
  MobileApiError,
  validateEndpoint,
  validatePublicKey,
  type StorageAdapter,
} from "./core";

// Web export is a build/smoke surface: sensitive values stay in memory on web.
const memory = new Map<string, string>();
const raw: StorageAdapter =
  Platform.OS === "web"
    ? {
        async getItem(k) {
          return memory.get(k) ?? null;
        },
        async setItem(k, v) {
          memory.set(k, v);
        },
        async removeItem(k) {
          memory.delete(k);
        },
      }
    : {
        getItem: (k) => SecureStore.getItemAsync(k),
        setItem: (k, v) =>
          SecureStore.setItemAsync(k, v, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        removeItem: (k) => SecureStore.deleteItemAsync(k),
      };
export const secureStorage = createChunkStorage(raw);
export const drafts = new DraftRepository(secureStorage);
export const authRedirect =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || "adequate://auth/callback";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const publicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
export const allowInsecureLocalDev =
  process.env.EXPO_PUBLIC_ALLOW_INSECURE_LOCAL_DEV === "true";
function validConfiguration() {
  try {
    validateEndpoint(supabaseUrl, allowInsecureLocalDev);
    validateEndpoint(apiUrl, allowInsecureLocalDev);
    validatePublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}
export const configured = validConfiguration();
export const supabase = configured
  ? createClient(supabaseUrl, publicKey, {
      auth: {
        storage: secureStorage,
        storageKey: "adequate.auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        lock: processLock,
      },
    })
  : null;
export const api = configured
  ? createApiClient({
      baseUrl: apiUrl,
      allowInsecureLocalDev,
      getToken: async () => {
        const result = await supabase!.auth.getSession();
        if (result.error)
          throw new MobileApiError(
            "Your session needs to be renewed. Sign in again.",
            "AUTH_REQUIRED",
          );
        return result.data.session?.access_token ?? null;
      },
    })
  : async <T>(_path: string, _init?: RequestInit): Promise<T> => {
      throw new MobileApiError(
        "Configure the approved API and Supabase project before signing in.",
        "NOT_CONFIGURED",
      );
    };
export async function clearLocalAccount() {
  await drafts.clearAccount();
  try {
    await supabase?.auth.signOut({ scope: "local" });
  } finally {
    await secureStorage.removeItem("adequate.auth");
    await secureStorage.removeItem("adequate.auth-code-verifier");
  }
}
