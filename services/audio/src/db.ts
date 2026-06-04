import { MongoClient, GridFSBucket, type Db } from "mongodb";
import { config } from "./config.js";

let client: MongoClient | null = null;
let bucket: GridFSBucket | null = null;
let database: Db | null = null;

export async function connect(): Promise<void> {
  client = new MongoClient(config.mongoUri);
  await client.connect();
  database = client.db();
  bucket = new GridFSBucket(database, { bucketName: config.bucketName });
  console.log("[audio] connected to MongoDB, GridFS bucket ready");
}

export function getBucket(): GridFSBucket {
  if (!bucket) throw new Error("GridFS bucket not initialized");
  return bucket;
}

export function getDb(): Db {
  if (!database) throw new Error("Database not initialized");
  return database;
}
