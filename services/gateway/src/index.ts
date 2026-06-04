import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "./config.js";

const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// NOTE: no body parser here — bodies (incl. multipart audio uploads) must be
// streamed through to the downstream services untouched.

// Mount at root with pathFilter so the full `/api/...` path is preserved for
// pathRewrite (Express strips the mount prefix if you mount at a sub-path,
// which would break the rewrite and forward `/` to the downstream service).
app.use(
  createProxyMiddleware({
    target: config.sentencesUrl,
    changeOrigin: true,
    pathFilter: "/api/sentences",
    pathRewrite: { "^/api/sentences": "/sentences" },
  }),
);

app.use(
  createProxyMiddleware({
    target: config.audioUrl,
    changeOrigin: true,
    pathFilter: "/api/audio",
    pathRewrite: { "^/api/audio": "/audio" },
  }),
);

app.listen(config.port, () => {
  console.log(`[gateway] listening on port ${config.port}`);
  console.log(`[gateway]   /api/sentences -> ${config.sentencesUrl}`);
  console.log(`[gateway]   /api/audio     -> ${config.audioUrl}`);
});
