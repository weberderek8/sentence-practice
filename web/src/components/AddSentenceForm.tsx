import { useState } from "react";
import type { CreateSentenceInput } from "@sentence-practice/shared";

interface Props {
  onCreate: (input: CreateSentenceInput) => Promise<void>;
}

export function AddSentenceForm({ onCreate }: Props) {
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!english.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        english: english.trim(),
        translation: translation.trim() || undefined,
      });
      setEnglish("");
      setTranslation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add sentence");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card add-form" onSubmit={submit}>
      <h2>Add a sentence</h2>
      <label>
        English
        <input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="The weather is nice today."
          required
        />
      </label>
      <label>
        Translation (optional)
        <input
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="Add now or later"
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Adding…" : "Add sentence"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
