import { useState } from "react";
import type { Sentence, UpdateSentenceInput } from "@sentence-practice/shared";
import { api } from "../api";
import { AudioPlayer } from "./AudioPlayer";
import { AudioRecorder } from "./AudioRecorder";
import { AudioUpload } from "./AudioUpload";

interface Props {
  sentence: Sentence;
  onUpdate: (id: string, input: UpdateSentenceInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SentenceItem({ sentence, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [translation, setTranslation] = useState(sentence.translation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveTranslation() {
    setBusy(true);
    setError(null);
    try {
      await onUpdate(sentence.id, { translation: translation.trim() });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function attachAudio(blob: Blob, filename: string) {
    setBusy(true);
    setError(null);
    try {
      const { fileId } = await api.uploadAudio(blob, filename);
      await onUpdate(sentence.id, { audioId: fileId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card sentence">
      <p className="english">{sentence.english}</p>

      <div className="translation-row">
        <span className="lang">Translation:</span>
        {editing ? (
          <>
            <input
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Enter translation"
            />
            <button onClick={saveTranslation} disabled={busy}>
              Save
            </button>
            <button
              className="secondary"
              onClick={() => {
                setTranslation(sentence.translation);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="translation">
              {sentence.translation || <em>no translation yet</em>}
            </span>
            <button className="secondary" onClick={() => setEditing(true)}>
              {sentence.translation ? "Edit" : "Add translation"}
            </button>
          </>
        )}
      </div>

      <div className="audio-row">
        {sentence.audioId ? (
          <AudioPlayer fileId={sentence.audioId} />
        ) : (
          <span className="muted">No audio yet.</span>
        )}
        <AudioRecorder onRecorded={attachAudio} disabled={busy} />
        <AudioUpload
          onSelected={(file) => attachAudio(file, file.name)}
          disabled={busy}
        />
      </div>

      <div className="actions">
        <button className="danger" onClick={() => onDelete(sentence.id)}>
          Delete
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </li>
  );
}
