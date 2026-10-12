import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import type { Session } from "@supabase/supabase-js";
import {
  approvedTokens,
  authSchema,
  consentSchema,
  preferencesSchema,
  profileSchema,
  reflectionSchema,
  type Reflection,
} from "@adequate/domain";
import { parseAuthLink, MobileApiError, preferenceInput } from "./src/core";
import {
  api,
  authRedirect,
  clearLocalAccount,
  configured,
  drafts,
  supabase,
} from "./src/services";
import {
  Action,
  Brand,
  Card,
  Field,
  Heading,
  Orbit,
  PaletteContext,
  Row,
  Txt,
  styles,
  usePalette,
} from "./src/ui";
import type {
  Bookmark,
  Consent,
  ContentRow,
  MemberData,
  Playback,
  Preferences,
  SessionInfo,
} from "./src/types";
import { AudioView } from "./src/AudioView";

type Tab = "today" | "reflections" | "library" | "saved" | "preferences";
const tabs: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "reflections", label: "Reflections" },
  { id: "library", label: "Listen & read" },
  { id: "saved", label: "Saved" },
  { id: "preferences", label: "Preferences" },
];
const errorMessage = (value: unknown) =>
  value instanceof Error && value.name === "ZodError" ? "Check the fields and try again." : value instanceof Error ? value.message : "The request could not be completed. Please try again.";
const fonts = {
  "SpaceGrotesk-Regular": require("./assets/fonts/SpaceGrotesk-Regular.ttf"),
  "SpaceGrotesk-Medium": require("./assets/fonts/SpaceGrotesk-Medium.ttf"),
  "SpaceGrotesk-Bold": require("./assets/fonts/SpaceGrotesk-Bold.ttf"),
  "IBMPlexMono-Regular": require("./assets/fonts/IBMPlexMono-Regular.ttf"),
  "IBMPlexMono-Medium": require("./assets/fonts/IBMPlexMono-Medium.ttf"),
};

export default function App() {
  const [loaded, fontError] = useFonts(fonts),
    [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(!configured),
    [notice, setNotice] = useState(""),
    [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setReady(true);
          if (error)
            setNotice(
              "The saved session could not be restored. Sign in again.",
            );
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
          setNotice(
            "Session recovery is unavailable. Reconnect and try again.",
          );
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT")
        void drafts
          .clearAccount()
          .catch(() =>
            setNotice(
              "Local draft cleanup failed. Close the app and retry before sharing this device.",
            ),
          );
      setSession(next);
    });
    if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
    const state = AppState.addEventListener("change", (next) => {
      if (next === "active") supabase?.auth.startAutoRefresh();
      else supabase?.auth.stopAutoRefresh();
    });
    const handleLink = async (url: string) => {
      try {
        const parsed = parseAuthLink(url, authRedirect);
        if (!parsed) return;
        const result =
          parsed.kind === "session"
            ? await supabase!.auth.setSession({
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
              })
            : parsed.kind === "code"
              ? await supabase!.auth.exchangeCodeForSession(parsed.code)
              : await supabase!.auth.verifyOtp({
                  token_hash: parsed.token_hash,
                  type: parsed.type,
                });
        if (result.error) throw result.error;
        if (active) {
          setRecovery(parsed.recovery);
          setNotice(
            parsed.recovery
              ? "Identity verified. Set a new password."
              : "Identity verified. Your account is ready.",
          );
        }
      } catch {
        if (active)
          setNotice(
            "The verification link could not be accepted. Request a new verification or recovery email.",
          );
      }
    };
    void Linking.getInitialURL().then((url) => {
      if (url) return handleLink(url);
    });
    const links = Linking.addEventListener(
      "url",
      ({ url }) => void handleLink(url),
    );
    return () => {
      active = false;
      subscription.unsubscribe();
      state.remove();
      links.remove();
      supabase?.auth.stopAutoRefresh();
    };
  }, []);
  const signOut = async () => {
    let remote = true;
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      remote = false;
    }
    try {
      await clearLocalAccount();
      setSession(null);
      setRecovery(false);
      setNotice(
        remote
          ? "Signed out. Private drafts on this device were removed."
          : "Signed out on this device and private drafts removed. Other-session revocation could not be confirmed while disconnected.",
      );
    } catch {
      setNotice(
        "Sign-out cleanup could not finish. Retry before sharing this device.",
      );
    }
  };
  return (
    <SafeAreaProvider>
      <PaletteContext.Provider value={approvedTokens.dark}>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: approvedTokens.dark.bg }}
        >
          <StatusBar style="light" />
          {fontError ? (
            <View style={styles.page}>
              <Text style={{ color: approvedTokens.dark.ink }}>
                Bundled fonts could not be loaded. Restart the app.
              </Text>
            </View>
          ) : !loaded || !ready ? (
            <View
              style={[
                styles.page,
                { alignItems: "center", justifyContent: "center", flex: 1 },
              ]}
            >
              <ActivityIndicator color={approvedTokens.dark.accent} />
            </View>
          ) : !configured ? (
            <View style={styles.page}>
              <Brand />
              <Heading>Connection setup required</Heading>
              <Txt>
                Configure the approved API URL, Supabase project URL and public
                key in this app’s environment, then rebuild. This app has no
                substitute member data or recordings.
              </Txt>
              <Txt muted>
                Use a development build for secure native sessions and account
                verification. The web export keeps sensitive drafts and sessions
                in memory.
              </Txt>
            </View>
          ) : session ? (
            <MemberApp
              key={session.user.id}
              ownerId={session.user.id}
              email={session.user.email ?? ""}
              recovery={recovery}
              endRecovery={() => setRecovery(false)}
              signOut={signOut}
              notice={notice}
            />
          ) : (
            <Auth notice={notice} />
          )}
        </SafeAreaView>
      </PaletteContext.Provider>
    </SafeAreaProvider>
  );
}

function Auth({ notice }: { notice: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "recover">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [signupEnabled, setSignupEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    void api<SessionInfo>("/api/session")
      .then((value) => {
        if (active) setSignupEnabled(value.signup_enabled);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      const body =
        mode === "recover"
          ? { email: email.trim() }
          : authSchema.parse({ email: email.trim(), password });
      if (mode === "recover" && !/^\S+@\S+\.\S+$/.test(email.trim()))
        throw new Error("Enter a valid email address.");
      const result = await api<{
        session?: { access_token: string; refresh_token: string } | null;
        message?: string;
        verification_required?: boolean;
      }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      if (result.session) {
        const sessionResult = await supabase!.auth.setSession(result.session);
        if (sessionResult.error) throw sessionResult.error;
        setPassword("");
      } else {
        setMessage(
          result.message ??
            "Check your email to verify your account before signing in.",
        );
        setPassword("");
      }
    } catch (reason) {
      setMessage(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <Brand />
        <Heading>
          {mode === "login"
            ? "Welcome back"
            : mode === "signup"
              ? "Create an account"
              : "Recover your account"}
        </Heading>
        <Txt muted>
          Reflections stay private to your account. Email verification protects
          access.
        </Txt>
        {notice ? <Txt>{notice}</Txt> : null}
        {message ? <Txt>{message}</Txt> : null}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />
        {mode !== "recover" ? (
          <Field
            label="Password · at least 12 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={mode === "login" ? "password" : "newPassword"}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        ) : null}
        <Action
          label={
            busy
              ? "Connecting…"
              : mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send recovery email"
          }
          disabled={
            busy ||
            !email ||
            (mode !== "recover" && !password) ||
            (mode === "signup" && !signupEnabled)
          }
          onPress={() => void submit()}
        />
        <Row>
          <Action
            label={mode === "login" ? "Recover password" : "Back to sign in"}
            secondary
            disabled={busy}
            onPress={() => {
              setMode(mode === "login" ? "recover" : "login");
              setMessage("");
              setPassword("");
            }}
          />
          {signupEnabled ? (
            <Action
              label="Create account"
              secondary
              disabled={busy}
              onPress={() => {
                setMode("signup");
                setMessage("");
                setPassword("");
              }}
            />
          ) : null}
        </Row>
        {!signupEnabled ? (
          <Txt muted>
            New account registration awaits the approved age policy and operator
            configuration. Existing approved accounts can sign in.
          </Txt>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MemberApp({
  ownerId,
  email,
  recovery,
  endRecovery,
  signOut,
  notice,
}: {
  ownerId: string;
  email: string;
  recovery: boolean;
  endRecovery: () => void;
  signOut: () => Promise<void>;
  notice: string;
}) {
  const [tab, setTab] = useState<Tab>("today"),
    [data, setData] = useState<MemberData | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [selected, setSelected] = useState<ContentRow | null>(null),
    [editing, setEditing] = useState<Reflection | null>(null),
    [query, setQuery] = useState("");
  const system = useColorScheme(),
    { width } = useWindowDimensions();
  const wide = width >= 1000;
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const reload = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    const load = async () => {
      const account = await api<SessionInfo>("/api/session");
      if (account.user?.id !== ownerId)
        throw new MobileApiError(
          "Your session needs to be renewed. Sign in again.",
          "AUTH_REQUIRED",
        );
      const [
        content,
        reflections,
        bookmarks,
        preferences,
        consents,
        playback,
        profile,
      ] = await Promise.all([
        api<ContentRow[]>("/api/content"),
        api<Reflection[]>("/api/reflections"),
        api<Bookmark[]>("/api/bookmarks"),
        api<Preferences>("/api/preferences"),
        api<Consent[]>("/api/consents"),
        api<Playback[]>("/api/playback"),
        api<MemberData["profile"]>("/api/profile"),
      ]);
      if (active)
        setData({
          content,
          reflections,
          bookmarks,
          preferences,
          consents,
          playback,
          profile,
          session: account,
        });
    };
    void load()
      .catch((reason) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [ownerId, revision]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reload();
    });
    return () => subscription.remove();
  }, [reload]);
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selected) {
        setSelected(null);
        return true;
      }
      if (tab !== "today") {
        setTab("today");
        setEditing(null);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [selected, tab]);
  const c =
    approvedTokens[
      data?.preferences.theme === "light" ||
      (data?.preferences.theme === "system" && system === "light")
        ? "light"
        : "dark"
    ];
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      if (alive.current) setError(errorMessage(reason));
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const openContent = (content: ContentRow) =>
    void run(async () => {
      const detail = await api<ContentRow>(`/api/content/${content.id}`);
      if (alive.current) setSelected(detail);
    });
  const navigate = (next: Tab) => {
    setTab(next);
    setSelected(null);
    setEditing(null);
  };
  const content = selected ? (
    <ContentDetail
      content={selected}
      data={data}
      busy={busy}
      onBack={() => setSelected(null)}
      run={run}
      reload={reload}
    />
  ) : recovery ? (
    <Recovery busy={busy} run={run} finish={endRecovery} />
  ) : tab === "today" ? (
    <Today
      data={data}
      busy={busy}
      onReflect={() => navigate("reflections")}
      openContent={openContent}
    />
  ) : tab === "reflections" ? (
    <Reflections
      ownerId={ownerId}
      rows={data?.reflections ?? []}
      editing={editing}
      setEditing={setEditing}
      busy={busy}
      reload={reload}
      run={run}
    />
  ) : tab === "library" ? (
    <Library
      query={query}
      setQuery={setQuery}
      rows={data?.content ?? []}
      busy={busy}
      openContent={openContent}
      run={run}
    />
  ) : tab === "saved" ? (
    <View style={styles.stack}>
      <Heading>Saved content</Heading>
      {!data?.bookmarks.length ? (
        <Txt muted>
          No saved content yet. Save a published recording or reading from the
          library.
        </Txt>
      ) : (
        data.bookmarks.map((bookmark) => (
          <Card key={bookmark.content_id} label="Saved">
            {bookmark.content ? (
              <>
                <Heading size={23}>{bookmark.content.title}</Heading>
                <Action
                  label="Open saved content"
                  disabled={busy}
                  onPress={() => openContent(bookmark.content!)}
                />
              </>
            ) : (
              <Txt>This saved item is no longer published or available.</Txt>
            )}
            <Action
              label="Remove saved item"
              secondary
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  await api(`/api/bookmarks/${bookmark.content_id}`, {
                    method: "DELETE",
                  });
                  reload();
                })
              }
            />
          </Card>
        ))
      )}
    </View>
  ) : (
    <PreferencesScreen
      data={data}
      email={email}
      busy={busy}
      run={run}
      reload={reload}
      signOut={signOut}
    />
  );
  return (
    <PaletteContext.Provider value={c}>
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={c === approvedTokens.light ? "dark" : "light"} />
        <View style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
          {wide ? (
            <View
              style={{
                width: 220,
                padding: 20,
                gap: 24,
                borderRightWidth: 2,
                borderRightColor: c.ink,
              }}
            >
              <Brand />
              <Navigation active={tab} wide navigate={navigate} />
            </View>
          ) : (
            <View
              style={{
                padding: 16,
                borderBottomWidth: 2,
                borderBottomColor: c.ink,
              }}
            >
              <Brand />
            </View>
          )}
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.page,
                { maxWidth: 1400, width: "100%", alignSelf: "center" },
              ]}
              keyboardShouldPersistTaps="handled"
              refreshControl={undefined}
            >
              {notice ? <Txt>{notice}</Txt> : null}
              {busy ? (
                <ActivityIndicator
                  accessibilityLabel="Loading account data"
                  color={c.accent}
                />
              ) : null}
              {error ? (
                <Card label="Connection or account issue">
                  <Txt>{error}</Txt>
                  <Action
                    label="Reconnect and reload"
                    disabled={busy}
                    onPress={reload}
                  />
                  <Action
                    label="Sign out on this device"
                    secondary
                    disabled={busy}
                    onPress={() => void signOut()}
                  />
                </Card>
              ) : null}
              {!data && !busy ? (
                <Txt muted>
                  Account data could not be loaded. You can keep an unfinished
                  reflection securely on this device, then reconnect to save it
                  to your account.
                </Txt>
              ) : null}
              {content}
            </ScrollView>
          </KeyboardAvoidingView>
          {!wide ? <Navigation active={tab} navigate={navigate} /> : null}
        </View>
      </SafeAreaView>
    </PaletteContext.Provider>
  );
}

function Navigation({
  active,
  wide = false,
  navigate,
}: {
  active: Tab;
  wide?: boolean;
  navigate: (tab: Tab) => void;
}) {
  const c = usePalette();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: wide ? "column" : "row",
        borderTopWidth: wide ? 0 : 2,
        borderTopColor: c.ink,
        backgroundColor: c.surface,
      }}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === tab.id }}
          onPress={() => navigate(tab.id)}
          style={({ pressed }) => ({
            minHeight: 56,
            flex: wide ? undefined : 1,
            padding: wide ? 12 : 6,
            justifyContent: "center",
            backgroundColor:
              active === tab.id
                ? c.ink
                : pressed
                  ? c.surfaceAlt
                  : "transparent",
            borderLeftWidth: wide && active === tab.id ? 4 : 0,
            borderLeftColor: c.accent,
          })}
        >
          <Text
            style={{
              fontFamily: "SpaceGrotesk-Bold",
              fontSize: 12,
              textAlign: wide ? "left" : "center",
              color: active === tab.id ? c.bg : c.ink,
            }}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Today({
  data,
  busy,
  onReflect,
  openContent,
}: {
  data: MemberData | null;
  busy: boolean;
  onReflect: () => void;
  openContent: (content: ContentRow) => void;
}) {
  const { width } = useWindowDimensions();
  const large = width >= 1000,
    c = usePalette();
  const recording = data?.content.find((item) => item.kind === "audio");
  const reflectionDays = new Set(
    (data?.reflections ?? []).map((row) =>
      new Date(row.created_at).toDateString(),
    ),
  );
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - 6 + i);
    return date;
  });
  return (
    <View style={styles.stack}>
      <Txt mono size={12} style={{ color: c.accentText }}>
        YOU ARE HERE · TODAY · PRESENT MOMENT
      </Txt>
      <Heading>Today</Heading>
      <View style={{ flexDirection: large ? "row" : "column", gap: 20 }}>
        <Card
          label="Your reflection"
          style={{
            flex: large ? 2 : undefined,
            minHeight: large ? 340 : undefined,
            justifyContent: "space-between",
            backgroundColor: c.surfaceAlt,
          }}
        >
          <Heading size={23}>A place for your own words.</Heading>
          <Txt muted>
            Write privately. You choose what to record and what it means.
          </Txt>
          <Action label="Write a reflection" onPress={onReflect} />
        </Card>
        <View style={{ flex: large ? 1 : undefined, gap: 20 }}>
          <Card label="Listen">
            <View style={{ alignItems: "center" }}>
              <Orbit size={120} />
            </View>
            {recording ? (
              <>
                <Txt>{recording.title}</Txt>
                <Action
                  label="Open recording"
                  disabled={busy}
                  onPress={() => openContent(recording)}
                />
              </>
            ) : (
              <Txt muted>
                No approved recordings are published yet. Nothing here plays
                fabricated audio.
              </Txt>
            )}
          </Card>
          <Card label="Your path · review pending">
            <Txt muted>
              The pathway experience remains open for owner review. Your
              reflections and saved content work independently.
            </Txt>
          </Card>
        </View>
      </View>
      <View style={{ flexDirection: large ? "row" : "column", gap: 20 }}>
        <Card
          label="Community · disabled"
          style={{ flex: large ? 1 : undefined }}
        >
          <Txt muted>
            Circles remain closed until moderation and governance are approved.
          </Txt>
        </Card>
        <Card label="This week" style={{ flex: large ? 2 : undefined }}>
          <Row>
            {days.map((day) => {
              const on = reflectionDays.has(day.toDateString());
              return (
                <View
                  key={day.toISOString()}
                  accessible
                  accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: "long" })}: ${on ? "reflection recorded" : "no reflection recorded"}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderWidth: 1,
                    borderColor: c.line,
                    backgroundColor: on ? c.accent : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Txt size={12} style={{ color: on ? c.onAccent : c.ink }}>
                    {day.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </Txt>
                </View>
              );
            })}
          </Row>
          <Txt muted>A record of your reflections. No scores or streaks.</Txt>
        </Card>
      </View>
    </View>
  );
}

function Reflections({
  ownerId,
  rows,
  editing,
  setEditing,
  busy,
  reload,
  run,
}: {
  ownerId: string;
  rows: Reflection[];
  editing: Reflection | null;
  setEditing: (row: Reflection | null) => void;
  busy: boolean;
  reload: () => void;
  run: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [body, setBody] = useState(""),
    [restored, setRestored] = useState(false),
    [localNotice, setLocalNotice] = useState(""),
    [draftEditingId, setDraftEditingId] = useState<string | null>(null),
    [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const editingId = editing?.id ?? draftEditingId;
  const owner = useRef(ownerId),
    ready = useRef(false);
  useEffect(() => {
    let active = true;
    ready.current = false;
    void drafts
      .activate(ownerId)
      .then(() => drafts.read())
      .then((draft) => {
        if (active) {
          if (draft) {
            setBody(draft.body);
            setLocalNotice(
              "An unfinished private draft was restored from this device. Review it before saving.",
            );
            if (draft.editingId) {
              setDraftEditingId(draft.editingId);
              const row = rows.find((r) => r.id === draft.editingId);
              if (row) setEditing(row);
              else
                setLocalNotice(
                  "An unfinished edit was restored. Reconnect to update its original reflection; the edit will not be duplicated as a new entry.",
                );
            }
          }
          ready.current = true;
          setRestored(true);
        }
      })
      .catch(() => {
        if (active) {
          setLocalNotice(
            "Secure draft storage is unavailable. Keep the app open until you save; text cannot be preserved after closing.",
          );
          setRestored(true);
        }
      });
    return () => {
      active = false;
      ready.current = false;
    };
  }, [ownerId]);
  const update = (next: string, draftId: string | null = editingId) => {
    setBody(next);
    if (ready.current && owner.current === ownerId)
      void drafts
        .save({ body: next, editingId: draftId })
        .catch(() =>
          setLocalNotice(
            "The local draft could not be secured. Keep the app open and reconnect to save.",
          ),
        );
  };
  const save = () =>
    void run(async () => {
      const value = reflectionSchema.parse({ body });
      await api(
        editingId ? `/api/reflections/${editingId}` : "/api/reflections",
        { method: editingId ? "PATCH" : "POST", body: JSON.stringify(value) },
      );
      await drafts.discard();
      setBody("");
      setEditing(null);
      setDraftEditingId(null);
      setLocalNotice("Reflection saved privately to your account.");
      reload();
    });
  return (
    <View style={styles.stack}>
      <Heading>Private reflections</Heading>
      <Txt mono size={12}>
        Experience proposal · owner review pending
      </Txt>
      <Card label={editingId ? "Edit your reflection" : "Write privately"}>
        {localNotice ? <Txt>{localNotice}</Txt> : null}
        <Field
          label="Your reflection"
          value={body}
          onChangeText={update}
          multiline
          maxLength={20000}
          editable={restored && !busy}
          style={{ minHeight: 180 }}
        />
        <Txt muted>{body.length} / 20,000 characters</Txt>
        <Row>
          <Action
            label={editingId ? "Save changes" : "Save reflection"}
            disabled={busy || !body.trim() || !restored}
            onPress={save}
          />
          <Action
            label="Discard unfinished draft"
            secondary
            disabled={busy}
            onPress={() =>
              void run(async () => {
                await drafts.discard();
                setBody("");
                setEditing(null);
                setDraftEditingId(null);
                setLocalNotice("Unfinished draft removed from this device.");
              })
            }
          />
        </Row>
      </Card>
      {!rows.length ? (
        <Txt muted>No reflections have been loaded yet.</Txt>
      ) : (
        rows.map((row) => (
          <Card
            key={row.id}
            label={new Date(row.created_at).toLocaleDateString()}
          >
            <Txt>{row.body}</Txt>
            <Row>
              <Action
                label="Edit reflection"
                secondary
                disabled={busy}
                onPress={() => {
                  setEditing(row);
                  setDraftEditingId(row.id);
                  update(row.body, row.id);
                }}
              />
              <Action
                label="Delete reflection"
                secondary
                destructive
                disabled={busy}
                onPress={() => setConfirmDelete(row.id)}
              />
            </Row>
            {confirmDelete === row.id ? (
              <>
                <Txt>Delete this reflection permanently from your account?</Txt>
                <Row>
                  <Action
                    label="Confirm reflection deletion"
                    destructive
                    disabled={busy}
                    onPress={() =>
                      void run(async () => {
                        await api(`/api/reflections/${row.id}`, {
                          method: "DELETE",
                        });
                        if (editingId === row.id) {
                          await drafts.discard();
                          setBody("");
                          setEditing(null);
                          setDraftEditingId(null);
                        }
                        setConfirmDelete(null);
                        reload();
                      })
                    }
                  />
                  <Action
                    label="Cancel deletion"
                    secondary
                    onPress={() => setConfirmDelete(null)}
                  />
                </Row>
              </>
            ) : null}
          </Card>
        ))
      )}
    </View>
  );
}

function Library({
  query,
  setQuery,
  rows,
  busy,
  openContent,
  run,
}: {
  query: string;
  setQuery: (value: string) => void;
  rows: ContentRow[];
  busy: boolean;
  openContent: (row: ContentRow) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [results, setResults] = useState<ContentRow[] | null>(null);
  return (
    <View style={styles.stack}>
      <Heading>Listen & read</Heading>
      <Field
        label="Search published content"
        value={query}
        maxLength={240}
        onChangeText={setQuery}
      />
      <Action
        label="Search"
        disabled={busy}
        onPress={() =>
          void run(async () =>
            setResults(
              await api<ContentRow[]>(
                `/api/content?q=${encodeURIComponent(query)}`,
              ),
            ),
          )
        }
      />
      {!(results ?? rows).length ? (
        <Txt muted>No approved published content is available here yet.</Txt>
      ) : (
        (results ?? rows).map((row) => (
          <Card key={row.id} label={row.kind}>
            <Heading size={23}>{row.title}</Heading>
            <Txt muted>{row.body.slice(0, 200)}</Txt>
            <Action
              label="Open content"
              disabled={busy}
              onPress={() => openContent(row)}
            />
          </Card>
        ))
      )}
    </View>
  );
}
function ContentDetail({
  content,
  data,
  busy,
  onBack,
  run,
  reload,
}: {
  content: ContentRow;
  data: MemberData | null;
  busy: boolean;
  onBack: () => void;
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => void;
}) {
  const saved = data?.bookmarks.some((row) => row.content_id === content.id);
  return (
    <View style={styles.stack}>
      <Action label="Back to library" secondary onPress={onBack} />
      <Heading>{content.title}</Heading>
      {content.provenance === "ai_assisted" ? (
        <Txt mono size={12}>
          AI-assisted · approved for publication
        </Txt>
      ) : null}
      <Txt>{content.body}</Txt>
      <Action
        label={saved ? "Remove from saved content" : "Save content"}
        secondary
        disabled={busy}
        onPress={() =>
          void run(async () => {
            await api(
              saved ? `/api/bookmarks/${content.id}` : "/api/bookmarks",
              {
                method: saved ? "DELETE" : "POST",
                ...(saved
                  ? {}
                  : { body: JSON.stringify({ content_id: content.id }) }),
              },
            );
            reload();
          })
        }
      />
      {content.kind === "audio" && !content.media?.length ? (
        <Card label="Recording unavailable">
          <Txt>No rights-cleared recording is available for this item.</Txt>
        </Card>
      ) : null}
      {content.media
        ?.filter((media) => media.rights_status === "verified")
        .map((media) => (
          <AudioView
            key={media.id}
            content={content}
            media={media}
            resume={data?.playback.find((row) => row.content_id === content.id)}
          />
        ))}
    </View>
  );
}
function Recovery({
  busy,
  run,
  finish,
}: {
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  finish: () => void;
}) {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  return (
    <Card label="Verified recovery">
      <Heading>Set a new password</Heading>
      <Field
        label="New password · at least 12 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        textContentType="newPassword"
      />
      <Field
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
      />
      <Action
        label="Update password"
        disabled={busy || password.length < 12 || password !== confirm}
        onPress={() =>
          void run(async () => {
            await api("/api/auth/password", {
              method: "POST",
              body: JSON.stringify({ password }),
            });
            setPassword("");
            setConfirm("");
            finish();
          })
        }
      />
    </Card>
  );
}
function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        thumbColor={c.ink}
        trackColor={{ true: c.accent, false: c.line }}
      />
    </View>
  );
}
function PreferencesScreen({
  data,
  email,
  busy,
  run,
  reload,
  signOut,
}: {
  data: MemberData | null;
  email: string;
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => void;
  signOut: () => Promise<void>;
}) {
  const [name, setName] = useState(data?.profile.display_name ?? ""),
    [deletion, setDeletion] = useState("");
  const preferences = data?.preferences ?? {
    theme: "system",
    ai_enabled: false,
  };
  const savePreferences = (next: Preferences) =>
    void run(async () => {
      await api("/api/preferences", {
        method: "PUT",
          body: JSON.stringify(preferenceInput({...next})),
      });
      reload();
    });
  return (
    <View style={styles.stack}>
      <Heading>Preferences & privacy</Heading>
      <Txt mono size={12}>
        Experience proposal · owner review pending
      </Txt>
      <Txt muted>{email}</Txt>
      <Card label="Your profile">
        <Field
          label="Display name"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
        <Action
          label="Save display name"
          disabled={busy}
          onPress={() =>
            void run(async () => {
              await api("/api/profile", {
                method: "PATCH",
                body: JSON.stringify(
                  profileSchema.parse({ display_name: name }),
                ),
              });
              reload();
            })
          }
        />
      </Card>
      <Card label="Appearance">
        <Row>
          {(["system", "dark", "light"] as const).map((theme) => (
            <Action
              key={theme}
              label={
                theme === preferences.theme ? `${theme} · selected` : theme
              }
              secondary={theme !== preferences.theme}
              disabled={busy}
              onPress={() => savePreferences({ ...preferences, theme })}
            />
          ))}
        </Row>
      </Card>
      <Card label="Optional AI">
        <Toggle
          label="Enable AI-assisted tools"
          value={preferences.ai_enabled}
          disabled={busy}
          onChange={(value) =>
            savePreferences({ ...preferences, ai_enabled: value })
          }
        />
        <Txt muted>
          Manual reflections remain available. AI features require separate
          processing consent and service availability.
        </Txt>
        {(["ai_processing", "external_ai", "analytics"] as const).map(
          (purpose) => (
            <Toggle
              key={purpose}
              label={
                purpose === "ai_processing"
                  ? "Consent to AI processing"
                  : purpose === "external_ai"
                    ? "Consent to external AI processing"
                    : "Consent to analytics"
              }
              value={
                data?.consents.some(
                  (row) => row.purpose === purpose && row.granted,
                ) ?? false
              }
              disabled={busy}
              onChange={(granted) =>
                void run(async () => {
                  await api("/api/consents", {
                    method: "PUT",
                    body: JSON.stringify(
                      consentSchema.parse({ purpose, granted }),
                    ),
                  });
                  reload();
                })
              }
            />
          ),
        )}
      </Card>
      <Card label="Your data">
        <Txt>
          Your export contains private account information. Choose a private
          destination when sharing.
        </Txt>
        <Action
          label="Export and share my account data"
          secondary
          disabled={busy}
          onPress={() =>
            void run(async () => {
              const exported =
                await api<Record<string, unknown>>("/api/export");
              await Share.share({
                title: "ADEQUATE private account export",
                message: JSON.stringify(exported, null, 2),
              });
            })
          }
        />
        <Action
          label="Sign out"
          secondary
          disabled={busy}
          onPress={() => void signOut()}
        />
      </Card>
      <Card label="Delete account">
        <Txt>
          Deletion permanently removes your account data. Type DELETE to
          confirm.
        </Txt>
        <Field
          label="Account deletion confirmation"
          value={deletion}
          onChangeText={setDeletion}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Action
          label="Permanently delete my account"
          destructive
          disabled={busy || deletion !== "DELETE"}
          onPress={() =>
            void run(async () => {
              await api("/api/account", {
                method: "DELETE",
                body: JSON.stringify({ confirmation: "DELETE" }),
              });
              await clearLocalAccount();
            })
          }
        />
      </Card>
    </View>
  );
}
