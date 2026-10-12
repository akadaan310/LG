'use client';

import { useEffect, useRef, useState } from 'react';
import { api, type ContentRow, type MediaRow } from './api';
import { Empty, ErrorNotice, Loading, ProvenanceLabel } from './ui';

function timestamp(value: number) { const seconds = Math.floor(Number.isFinite(value) ? value : 0); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

export function AudioPlayer({ content }: { content: ContentRow }) {
  const [media, setMedia] = useState<MediaRow | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resume, setResume] = useState(0);
  const [resumeStatus, setResumeStatus] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const lastSave = useRef(0);
  useEffect(() => {
    let current = true;
    (async () => {
      await Promise.resolve();
      if (!current) return;
      setLoading(true); setUrl(''); setMedia(null); setError(null); setPlaying(false); setPosition(0); setDuration(0); setResume(0);
      try {
        const detail = content.media ? content : await api<ContentRow>(`/api/content/${encodeURIComponent(content.id)}`);
        const recording = detail.media?.find((item) => item.rights_status === 'verified' && (!item.mime_type || item.mime_type.startsWith('audio/')));
        if (!recording) return;
        const access = await api<{ url: string }>(`/api/media/${encodeURIComponent(recording.id)}/access`);
        try {
          const saved = await api<{ content_id: string; position_seconds: number }[]>('/api/playback');
          if (current) setResume(saved.find((item) => item.content_id === content.id)?.position_seconds ?? 0);
        } catch { /* Public playback remains available without a member account. */ }
        if (current) { setMedia(recording); setUrl(access.url); }
      } catch (reason) { if (current) setError(reason as Error); }
      finally { if (current) setLoading(false); }
    })();
    return () => { current = false; };
  }, [content]);
  const saveResume = async (seconds: number) => {
    try { await api('/api/playback', { method: 'PUT', body: JSON.stringify({ content_id: content.id, position_seconds: seconds }) }); setResumeStatus('Playback position saved.'); }
    catch { setResumeStatus('Sign in to save your playback position.'); }
  };
  const seek = (seconds: number) => { if (audio.current) { audio.current.currentTime = seconds; setPosition(seconds); } };
  if (loading) return <Loading />;
  if (error) return <ErrorNotice error={error} />;
  if (!url || !media) return <Empty>No rights-verified audio file is attached to this recording.</Empty>;
  return <div className="audio-player"><ProvenanceLabel provenance={content.provenance} />
    <audio ref={audio} src={url} preload="metadata" aria-label={content.title} onLoadedMetadata={() => { const element = audio.current; if (!element) return; setDuration(element.duration); if (resume > 0 && resume < element.duration) { element.currentTime = resume; setPosition(resume); } }} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); void saveResume(audio.current?.currentTime ?? 0); }} onEnded={() => { setPlaying(false); void saveResume(0); }} onError={() => setError(new Error('The recording could not be loaded. Its access link may have expired. Reload this page to request a fresh link.'))} onTimeUpdate={() => { const value = audio.current?.currentTime ?? 0; setPosition(value); if (value - lastSave.current >= 15) { lastSave.current = value; void saveResume(value); } }} />
    <div className="row"><button type="button" className="play-button" aria-label={playing ? `Pause ${content.title}` : `Play ${content.title}`} onClick={async () => { if (!audio.current) return; if (playing) audio.current.pause(); else { try { await audio.current.play(); } catch { setError(new Error('Playback could not start. Please try again.')); } } }}>{playing ? 'Ⅱ' : '▶'}</button><div className="audio-controls"><label htmlFor={`seek-${media.id}`}>Seek recording</label><input id={`seek-${media.id}`} type="range" min={0} max={duration || 0} step={1} value={Math.min(position, duration || 0)} disabled={!duration} onChange={(event) => seek(Number(event.target.value))} aria-valuetext={`${timestamp(position)} of ${timestamp(duration)}`} /><p className="mono">{timestamp(position)} / {timestamp(duration)}</p></div></div>
    <p className="muted" role="status">{resumeStatus}</p>
    {media.chapters?.length ? <nav aria-label="Recording chapters"><ol className="chapter-list">{media.chapters.map((chapter, index) => <li key={index}><button type="button" onClick={() => seek(chapter.start_seconds)}>{timestamp(chapter.start_seconds)} · {chapter.title}</button></li>)}</ol></nav> : null}
    {media.transcript ? <details><summary>Read transcript</summary><ProvenanceLabel provenance={content.provenance} /><p className="preserve">{media.transcript}</p></details> : <p className="muted">No transcript has been supplied.</p>}
    <ErrorNotice error={error} />
  </div>;
}
