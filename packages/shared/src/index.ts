/**
 * Shared domain types for Sentence Practice.
 * Imported by the backend services and the web frontend.
 */

/** A practice sentence: one English sentence, one translation, one audio file. */
export interface Sentence {
  /** MongoDB document id (string form of ObjectId). */
  id: string;
  /** The English source sentence. */
  english: string;
  /** The translation in the target language. Empty until added. */
  translation: string;
  /** GridFS file id (from the Audio service) for the recording, if linked. */
  audioId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a sentence. */
export interface CreateSentenceInput {
  english: string;
  translation?: string;
}

/** Payload to update a sentence (set translation and/or link audio). */
export interface UpdateSentenceInput {
  english?: string;
  translation?: string;
  audioId?: string | null;
}

/** Response from the Audio service after a successful upload. */
export interface AudioUploadResponse {
  fileId: string;
  contentType: string;
  length: number;
}
