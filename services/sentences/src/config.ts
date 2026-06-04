export const config = {
  port: Number(process.env.SENTENCES_PORT ?? 4001),
  mongoUri:
    process.env.SENTENCES_MONGO_URI ??
    "mongodb://localhost:27017/sentences_db",
};
