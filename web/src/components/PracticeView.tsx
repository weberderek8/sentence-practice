import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Sentence } from "@sentence-practice/shared";
import { api } from "../api";

const DEFAULT_PAUSE_SEC = 3;
const MIN_PAUSE_SEC = 1;
const MAX_PAUSE_SEC = 10;

// Upload-time windows for the time-range filter. days=0 means "all time".
const RANGES = [
  { label: "All time", days: 0 },
  { label: "Past 24 hours", days: 1 },
  { label: "Past 7 days", days: 7 },
  { label: "Past 30 days", days: 30 },
] as const;

interface Props {
  sentences: Sentence[];
}

/** Fisher-Yates shuffle into a new array (does not mutate the input). */
function shuffled(list: Sentence[]): Sentence[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Plays every sentence that has audio in sequence, with a 3-second pause
 * between each, looping back to the start after the last one. Playback can be
 * limited to a recent upload window and/or shuffled.
 */
export function PracticeView({ sentences }: Props) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [pausing, setPausing] = useState(false);
  const [rangeDays, setRangeDays] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [pauseSec, setPauseSec] = useState(DEFAULT_PAUSE_SEC);
  const [shuffleNonce, setShuffleNonce] = useState(0);

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

  // Sentences with audio, limited to the selected upload window (by createdAt).
  const filtered = useMemo(() => {
    const cutoff = rangeDays > 0 ? Date.now() - rangeDays * 86_400_000 : 0;
    return sentences.filter(
      (s) =>
        s.audioId && (cutoff === 0 || new Date(s.createdAt).getTime() >= cutoff),
    );
  }, [sentences, rangeDays]);

  // Actual play order. Reshuffled when shuffle is on and the nonce bumps (each
  // Play press); otherwise the provided newest-first order.
  const playList = useMemo(
    () => (shuffle ? shuffled(filtered) : filtered),
    // shuffleNonce intentionally forces a fresh shuffle on each Play press.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, shuffle, shuffleNonce],
  );
  const count = playList.length;

  const start = useCallback(() => {
    if (count === 0) return;
    clearTimer();
    setPausing(false);
    setIndex(0);
    setShuffleNonce((n) => n + 1);
    setPlaying(true);
  }, [count, clearTimer]);

  // Play the current clip whenever the index changes while playing.
  const current = count > 0 ? playList[index % count] : null;
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
    }, pauseSec * 1000);
  }

  function changeRange(days: number) {
    stop();
    setIndex(0);
    setRangeDays(days);
  }

  function toggleShuffle() {
    stop();
    setIndex(0);
    setShuffle((s) => !s);
  }

  return (
    <section className="practice">
      <h2>Practice playback</h2>
      <p className="muted">
        Plays each recording in order with a {pauseSec}-second pause between
        them, then loops.
      </p>

      <div className="practice-filters">
        <label>
          Time range
          <select
            value={rangeDays}
            onChange={(e) => changeRange(Number(e.target.value))}
          >
            {RANGES.map((r) => (
              <option key={r.days} value={r.days}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="shuffle-toggle">
          <input type="checkbox" checked={shuffle} onChange={toggleShuffle} />
          Shuffle
        </label>
        <label className="pause-control">
          Pause {pauseSec}s
          <input
            type="range"
            min={MIN_PAUSE_SEC}
            max={MAX_PAUSE_SEC}
            step={1}
            value={pauseSec}
            onChange={(e) => setPauseSec(Number(e.target.value))}
          />
        </label>
      </div>

      {count === 0 ? (
        <p className="muted">
          No recordings in this range. Add audio to a sentence in the Manage
          view, or widen the time range.
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
              {shuffle ? " · shuffled" : ""}
            </span>
          </div>

          <div className="card now-playing">
            <span className="lang">
              {playing
                ? `Now playing ${(index % count) + 1} / ${count}`
                : "Ready"}
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
