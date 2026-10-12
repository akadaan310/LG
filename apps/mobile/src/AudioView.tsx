import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { playbackSchema } from "@adequate/domain";
import { api, allowInsecureLocalDev } from "./services";
import { validateEndpoint } from "./core";
import { Action, Card, Field, Heading, Orbit, Row, Txt } from "./ui";
import type { ContentRow, MediaRow, Playback } from "./types";

const stamp = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export function AudioView({
  content,
  media,
  resume,
}: {
  content: ContentRow;
  media: MediaRow;
  resume: Playback | undefined;
}) {
  const [source, setSource] = useState<string | null>(null),
    [expires, setExpires] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [seek, setSeek] = useState("");
  const player = useAudioPlayer(source, {
    updateInterval: 1000,
    downloadFirst: false,
  });
  const status = useAudioPlayerStatus(player);
  const restored = useRef(false),
    lastSaved = useRef(-1),
    position = useRef(0);
  const savePosition = async (value: number) => {
    const body = playbackSchema.parse({
      content_id: content.id,
      position_seconds: Math.max(0, value),
    });
    await api("/api/playback", { method: "PUT", body: JSON.stringify(body) });
    lastSaved.current = value;
  };
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => setError("Audio output could not be initialized."));
  }, []);
  useEffect(() => {
    position.current = status.currentTime;
    if (status.isLoaded && !restored.current) {
      restored.current = true;
      if (resume?.position_seconds)
        void player
          .seekTo(
            Math.min(
              resume.position_seconds,
              status.duration || resume.position_seconds,
            ),
          )
          .catch(() => setError("The saved position could not be restored."));
    }
    if (
      status.isLoaded &&
      Math.abs(status.currentTime - lastSaved.current) >= 15 &&
      status.playing
    )
      void savePosition(status.currentTime).catch(() =>
        setError(
          "Playback continues. Resume position could not be synced; reconnect to save it.",
        ),
      );
  }, [status.currentTime, status.isLoaded, status.playing]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        try {
          player.pause();
        } catch {
          /* Player may have been released during navigation. */
        }
        if (position.current > 0)
          void savePosition(position.current).catch(() => undefined);
      }
    });
    return () => {
      subscription.remove();
      try {
        player.pause();
      } catch {
        /* The hook releases its native player on unmount. */
      }
      if (position.current > 0)
        void savePosition(position.current).catch(() => undefined);
    };
  }, [player, content.id]);
  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const access = await api<{ url: string; expires_at: string }>(
        `/api/media/${media.id}/access`,
      );
      const url = new URL(access.url);
      if (url.username || url.password)
        throw new Error("The recording URL contains forbidden credentials.");
      validateEndpoint(`${url.origin}${url.pathname}`, allowInsecureLocalDev);
      restored.current = false;
      setSource(access.url);
      setExpires(Date.parse(access.expires_at));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Recording unavailable.",
      );
    } finally {
      setBusy(false);
    }
  };
  const jump = async (value: number) => {
    try {
      await player.seekTo(
        Math.max(0, Math.min(value, status.duration || value)),
      );
      await savePosition(
        Math.max(0, Math.min(value, status.duration || value)),
      );
    } catch {
      setError(
        "The position could not be changed or synced. Try again when connected.",
      );
    }
  };
  return (
    <Card label="One voice · authorized recording">
      <Heading size={23}>{content.title}</Heading>
      <View style={{ alignItems: "center" }}>
        <Orbit
          progress={status.duration ? status.currentTime / status.duration : 0}
        />
      </View>
      {error ? <Txt>{error}</Txt> : null}
      {status.error ? (
        <Txt>
          The recording could not be loaded. Renew its access or reconnect.
        </Txt>
      ) : null}
      {source ? (
        <Action
          label="Renew recording access"
          secondary
          disabled={busy}
          onPress={() => void load()}
        />
      ) : null}
      {!source ? (
        <Action
          label={busy ? "Preparing recording…" : "Load recording"}
          disabled={busy}
          onPress={() => void load()}
        />
      ) : (
        <>
          <Txt mono>
            {stamp(status.currentTime)} / {stamp(status.duration)}
          </Txt>
          <Row>
            <Action
              label={status.playing ? "Pause recording" : "Play recording"}
              disabled={!status.isLoaded}
              onPress={() => {
                if (status.playing) {
                  player.pause();
                  void savePosition(status.currentTime).catch(() =>
                    setError("Resume position has not synced."),
                  );
                } else if (Date.now() >= expires) {
                  void load();
                  setError("Access renewed. Press play when ready.");
                } else {
                  player.play();
                }
              }}
            />
            <Action
              label="Back 15 seconds"
              secondary
              disabled={!status.isLoaded}
              onPress={() => void jump(status.currentTime - 15)}
            />
            <Action
              label="Forward 15 seconds"
              secondary
              disabled={!status.isLoaded}
              onPress={() => void jump(status.currentTime + 15)}
            />
          </Row>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Playback position"
            accessibilityValue={{
              min: 0,
              max: Math.floor(status.duration),
              now: Math.floor(status.currentTime),
              text: stamp(status.currentTime),
            }}
            accessibilityActions={[
              { name: "increment", label: "Forward fifteen seconds" },
              { name: "decrement", label: "Back fifteen seconds" },
            ]}
            onAccessibilityAction={(event) =>
              void jump(
                status.currentTime +
                  (event.nativeEvent.actionName === "increment" ? 15 : -15),
              )
            }
          >
            <Field
              label="Seek to seconds"
              value={seek}
              onChangeText={setSeek}
              keyboardType="decimal-pad"
            />
            <Action
              label="Seek"
              secondary
              disabled={
                !status.isLoaded ||
                !Number.isFinite(Number(seek)) ||
                Number(seek) < 0
              }
              onPress={() => void jump(Number(seek))}
            />
          </View>
        </>
      )}
      {media.chapters?.length ? (
        <View style={{ gap: 12 }}>
          <Heading size={19}>Chapters</Heading>
          {media.chapters.map((chapter, i) => (
            <Action
              key={`${chapter.start_seconds}-${i}`}
              label={`${chapter.title} · ${stamp(chapter.start_seconds)}`}
              secondary
              disabled={!status.isLoaded}
              onPress={() => void jump(chapter.start_seconds)}
            />
          ))}
        </View>
      ) : null}
      <Heading size={19}>Transcript</Heading>
      <Txt>
        {media.transcript ||
          "No approved transcript is available for this recording yet."}
      </Txt>
    </Card>
  );
}
