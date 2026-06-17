import { Router, type Request, type Response } from "express";
import { isValidObjectId } from "mongoose";
import type {
  CreateSentenceInput,
  UpdateSentenceInput,
} from "@sentence-practice/shared";
import { SentenceModel, toSentence } from "./model.js";

export const sentencesRouter = Router();

sentencesRouter.get("/", async (_req: Request, res: Response) => {
  const docs = await SentenceModel.find().sort({ createdAt: -1 }).exec();
  res.json(docs.map(toSentence));
});

sentencesRouter.get("/:id", async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const doc = await SentenceModel.findById(req.params.id).exec();
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json(toSentence(doc));
});

sentencesRouter.post("/", async (req: Request, res: Response) => {
  const body = req.body as CreateSentenceInput;
  if (!body?.english?.trim()) {
    return res.status(400).json({ error: "english is required" });
  }
  const doc = await SentenceModel.create({
    english: body.english,
    translation: body.translation ?? "",
  });
  return res.status(201).json(toSentence(doc));
});

sentencesRouter.patch("/:id", async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const body = req.body as UpdateSentenceInput;
  const update: Record<string, unknown> = {};
  if (body.english !== undefined) update.english = body.english;
  if (body.translation !== undefined) update.translation = body.translation;
  if (body.audioId !== undefined) update.audioId = body.audioId;

  const doc = await SentenceModel.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).exec();
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json(toSentence(doc));
});

sentencesRouter.delete("/:id", async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const doc = await SentenceModel.findByIdAndDelete(req.params.id).exec();
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.status(204).end();
});
