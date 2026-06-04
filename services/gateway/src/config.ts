export const config = {
  port: Number(process.env.GATEWAY_PORT ?? 8080),
  sentencesUrl: process.env.SENTENCES_URL ?? "http://localhost:4001",
  audioUrl: process.env.AUDIO_URL ?? "http://localhost:4002",
};
