import express from "express";
import cors from "cors";
import { sentencesRouter } from "./routes.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "sentences" });
  });

  app.use("/sentences", sentencesRouter);

  // Fallback error handler.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction,
    ) => {
      console.error("[sentences] unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
