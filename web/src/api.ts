import type {
  AudioUploadResponse,
  CreateSentenceInput,
  Sentence,
  UpdateSentenceInput,
} from "@sentence-practice/shared";

const API = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listSentences(): Promise<Sentence[]> {
    return fetch(`${API}/sentences`).then((r) => json<Sentence[]>(r));
  },

  createSentence(input: CreateSentenceInput): Promise<Sentence> {
    return fetch(`${API}/sentences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<Sentence>(r));
  },

  updateSentence(id: string, input: UpdateSentenceInput): Promise<Sentence> {
    return fetch(`${API}/sentences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<Sentence>(r));
  },

  async deleteSentence(id: string): Promise<void> {
    const res = await fetch(`${API}/sentences/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  },

  uploadAudio(blob: Blob, filename: string): Promise<AudioUploadResponse> {
    const form = new FormData();
    form.append("audio", blob, filename);
    return fetch(`${API}/audio`, { method: "POST", body: form }).then((r) =>
      json<AudioUploadResponse>(r),
    );
  },

  audioUrl(fileId: string): string {
    return `${API}/audio/${fileId}`;
  },
};
