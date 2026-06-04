import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import type { Sentence } from "@sentence-practice/shared";

const sentenceSchema = new Schema(
  {
    english: { type: String, required: true, trim: true },
    translation: { type: String, default: "", trim: true },
    audioId: { type: String, default: null },
  },
  { timestamps: true },
);

export type SentenceDoc = HydratedDocument<InferSchemaType<typeof sentenceSchema>>;

export const SentenceModel = model("Sentence", sentenceSchema);

/** Convert a Mongoose document into the shared API shape. */
export function toSentence(doc: SentenceDoc): Sentence {
  return {
    id: doc._id.toString(),
    english: doc.english,
    translation: doc.translation ?? "",
    audioId: doc.audioId ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}
