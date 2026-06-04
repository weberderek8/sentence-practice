import { useCallback, useEffect, useRef, useState } from "react";
import type { Sentence } from "@sentence-practice/shared";
import { api } from "../api";

interface Props {
  sentences: Sentence[];
}

function pickRandom(list: Sentence[], excludeId?: string): Sentence | null {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  while (next.id === excludeId) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

/**
 * Shows a random English sentence. Clicking the card flips it to reveal the
 * translation and plays the audio recording if one exists.
 */
export function FlashcardView({ sentences }: Props) {
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [flipped, setFlipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const draw = useCallback(() => {
    setFlipped(false);
    setCurrent((prev) => pickRandom(sentences, prev?.id));
  }, [sentences]);

  // Pick a first card once sentences are available.
  useEffect(() => {
    if (!current && sentences.length > 0) {
      setCurrent(pickRandom(sentences));
    }
  }, [sentences, current]);

  function flip() {
    if (!current) return;
    const next = !flipped;
    setFlipped(next);
    if (next && current.audioId && audioRef.current) {
      audioRef.current.src = api.audioUrl(current.audioId);
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {});
    }
  }

  if (sentences.length === 0) {
    return (
      <section className="flashcards">
        <h2>Flashcards</h2>
        <p className="muted">
          No sentences yet. Add some in the Manage view first.
        </p>
      </section>
    );
  }

  return (
    <section className="flashcards">
      <h2>Flashcards</h2>
      <p className="muted">
        Tap the card to flip it — see the translation and hear the recording.
      </p>

      {current && (
        <button
          type="button"
          className={flipped ? "flashcard flipped" : "flashcard"}
          onClick={flip}
        >
          {flipped ? (
            <>
              <span className="flashcard-label">Translation</span>
              <span className="flashcard-text">
                {current.translation || <em>no translation</em>}
              </span>
              <span className="flashcard-hint">
                {current.audioId ? "♪ playing audio" : "no audio for this one"}
              </span>
            </>
          ) : (
            <>
              <span className="flashcard-label">English</span>
              <span className="flashcard-text">{current.english}</span>
              <span className="flashcard-hint">tap to flip</span>
            </>
          )}
        </button>
      )}

      <div className="flashcard-controls">
        <button onClick={draw}>↻ Next random</button>
      </div>

      <audio ref={audioRef} />
    </section>
  );
}
