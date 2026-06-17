import express from "express";
import cors from "cors";
import multer from "multer";
import { audioRouter } from "./routes.js";

export function createApp() {
  const app = express();
  app.use(cors());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "audio" });
  });

  app.use("/audio", audioRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction,
    ) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      }
      console.error("[audio] unhandled error:", err);
      return res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
