import { useCallback, useEffect, useState } from "react";
import type {
  CreateSentenceInput,
  Sentence,
  UpdateSentenceInput,
} from "@sentence-practice/shared";
import { api } from "./api";
import { AddSentenceForm } from "./components/AddSentenceForm";
import { SentenceItem } from "./components/SentenceItem";
import { PracticeView } from "./components/PracticeView";
import { FlashcardView } from "./components/FlashcardView";

type View = "manage" | "listen" | "flashcards";

export function App() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("manage");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setSentences(await api.listSentences());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sentences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(
    async (input: CreateSentenceInput) => {
      const created = await api.createSentence(input);
      setSentences((prev) => [created, ...prev]);
    },
    [],
  );

  const handleUpdate = useCallback(
    async (id: string, input: UpdateSentenceInput) => {
      const updated = await api.updateSentence(id, input);
      setSentences((prev) => prev.map((s) => (s.id === id ? updated : s)));
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    await api.deleteSentence(id);
    setSentences((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Sentence Practice</h1>
        <p className="muted">
          Save a sentence, add its translation, and attach an audio recording.
        </p>
        <nav className="tabs">
          <button
            className={view === "manage" ? "tab active" : "tab"}
            onClick={() => setView("manage")}
          >
            Manage
          </button>
          <button
            className={view === "listen" ? "tab active" : "tab"}
            onClick={() => setView("listen")}
          >
            Listen
          </button>
          <button
            className={view === "flashcards" ? "tab active" : "tab"}
            onClick={() => setView("flashcards")}
          >
            Flashcards
          </button>
        </nav>
      </header>

      {view === "listen" ? (
        <PracticeView sentences={sentences} />
      ) : view === "flashcards" ? (
        <FlashcardView sentences={sentences} />
      ) : (
        <>
          <AddSentenceForm onCreate={handleCreate} />

          <section>
            <h2>Your sentences</h2>
            {loading && <p>Loading…</p>}
            {error && <p className="error">{error}</p>}
            {!loading && sentences.length === 0 && (
              <p className="muted">No sentences yet. Add your first one above.</p>
            )}
            <ul className="sentence-list">
              {sentences.map((s) => (
                <SentenceItem
                  key={s.id}
                  sentence={s}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
