import { Router, type Request, type Response } from "express";
import multer from "multer";
import { ObjectId } from "mongodb";
import type { AudioUploadResponse } from "@sentence-practice/shared";
import { config } from "./config.js";
import { getBucket, getDb } from "./db.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxAudioBytes },
});

export const audioRouter = Router();

interface AudioFileDoc {
  _id: ObjectId;
  length: number;
  filename: string;
  contentType?: string;
  metadata?: { contentType?: string };
}

async function findFile(id: string): Promise<AudioFileDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const files = getDb().collection<AudioFileDoc>(`${config.bucketName}.files`);
  return files.findOne({ _id: new ObjectId(id) });
}

function resolveContentType(file: AudioFileDoc): string {
  return (
    file.metadata?.contentType ?? file.contentType ?? "application/octet-stream"
  );
}

audioRouter.post(
  "/",
  upload.single("audio"),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "Missing 'audio' file field" });
    }
    const contentType = req.file.mimetype || "application/octet-stream";
    const filename = req.file.originalname || `audio-${Date.now()}`;

    const uploadStream = getBucket().openUploadStream(filename, {
      contentType,
      metadata: { contentType },
    });

    uploadStream.on("error", (err) => {
      console.error("[audio] upload error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to store audio" });
      }
    });

    uploadStream.on("finish", () => {
      const body: AudioUploadResponse = {
        fileId: uploadStream.id.toString(),
        contentType,
        length: req.file!.size,
      };
      res.status(201).json(body);
    });

    return uploadStream.end(req.file.buffer);
  },
);

audioRouter.get("/:id", async (req: Request, res: Response) => {
  const file = await findFile(req.params.id);
  if (!file) return res.status(404).json({ error: "Not found" });

  const contentType = resolveContentType(file);
  const total = file.length;
  const range = req.headers.range;

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType);

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.status(416).end();
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : total - 1;

    if (start > end || start >= total || end >= total) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.status(416).end();
    }

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    res.setHeader("Content-Length", end - start + 1);
    // GridFS download `end` is exclusive.
    const stream = getBucket().openDownloadStream(file._id, {
      start,
      end: end + 1,
    });
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
      else res.end();
    });
    return stream.pipe(res);
  }

  res.status(200);
  res.setHeader("Content-Length", total);
  const stream = getBucket().openDownloadStream(file._id);
  stream.on("error", () => {
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  return stream.pipe(res);
});

audioRouter.delete("/:id", async (req: Request, res: Response) => {
  const file = await findFile(req.params.id);
  if (!file) return res.status(404).json({ error: "Not found" });
  await getBucket().delete(file._id);
  return res.status(204).end();
});
