import { useCallback, useEffect, useRef, useState } from "react";
import type { Sentence } from "@sentence-practice/shared";
import { api } from "../api";

const PAUSE_MS = 3000;

interface Props {
  sentences: Sentence[];
}

/**
 * Plays every sentence that has audio in sequence, with a 3-second pause
 * between each, looping back to the start after the last one.
 */
export function PracticeView({ sentences }: Props) {
  const withAudio = sentences.filter((s) => s.audioId);
  const count = withAudio.length;

  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [pausing, setPausing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setPlaying(false);
    setPausing(false);
    audioRef.current?.pause();
  }, [clearTimer]);

  const start = useCallback(() => {
    if (count === 0) return;
    clearTimer();
    setPausing(false);
    setIndex(0);
    setPlaying(true);
  }, [count, clearTimer]);

  // Play the current clip whenever the index changes while playing.
  const current = count > 0 ? withAudio[index % count] : null;
  const currentAudioId = current?.audioId ?? null;

  useEffect(() => {
    if (!playing || !currentAudioId) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = api.audioUrl(currentAudioId);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay can be blocked; stop gracefully.
      stop();
    });
  }, [playing, index, currentAudioId, stop]);

  // Stop everything on unmount.
  useEffect(() => () => clearTimer(), [clearTimer]);

  function handleEnded() {
    if (!playing || count === 0) return;
    setPausing(true);
    timerRef.current = setTimeout(() => {
      setPausing(false);
      setIndex((i) => (i + 1) % count);
    }, PAUSE_MS);
  }

  return (
    <section className="practice">
      <h2>Practice playback</h2>
      <p className="muted">
        Plays each recording in order with a {PAUSE_MS / 1000}-second pause
        between them, then loops.
      </p>

      {count === 0 ? (
        <p className="muted">
          No recordings yet. Add audio to a sentence in the Manage view first.
        </p>
      ) : (
        <>
          <div className="practice-controls">
            {playing ? (
              <button className="danger" onClick={stop}>
                ⏹ Stop
              </button>
            ) : (
              <button onClick={start}>▶ Play loop</button>
            )}
            <span className="muted">
              {count} recording{count === 1 ? "" : "s"}
            </span>
          </div>

          <div className="card now-playing">
            <span className="lang">
              {playing ? `Now playing ${(index % count) + 1} / ${count}` : "Ready"}
              {pausing && " — pausing…"}
            </span>
            <p className="english">{current?.english}</p>
            <p className="translation">
              {current?.translation || <em>no translation</em>}
            </p>
          </div>
        </>
      )}

      {/* Single hidden audio element drives the whole loop. */}
      <audio ref={audioRef} onEnded={handleEnded} />
    </section>
  );
}
