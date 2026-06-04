export const config = {
  port: Number(process.env.AUDIO_PORT ?? 4002),
  mongoUri:
    process.env.AUDIO_MONGO_URI ?? "mongodb://localhost:27017/audio_db",
  maxAudioBytes: Number(process.env.MAX_AUDIO_BYTES ?? 26214400),
  bucketName: "audio",
};
