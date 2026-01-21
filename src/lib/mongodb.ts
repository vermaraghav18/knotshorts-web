// src/lib/mongodb.ts
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongo: {
    client?: MongoClient;
    promise?: Promise<MongoClient>;
  } | undefined;
}

const uri = process.env.MONGODB_URI;
const envDbName = process.env.MONGODB_DB;

function inferDbNameFromUri(u: string) {
  try {
    // Works for both mongodb:// and mongodb+srv://
    const url = new URL(u);
    const pathname = (url.pathname || "").replace("/", "").trim();
    return pathname || "test";
  } catch {
    return "test";
  }
}

export function getMongoDbName() {
  if (envDbName && envDbName.trim()) return envDbName.trim();
  if (!uri) return "test";
  return inferDbNameFromUri(uri);
}

export async function getMongoClient() {
  if (!uri) {
    // IMPORTANT: throw ONLY when called (so routes can catch and respond JSON)
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  const globalCache = (global._mongo ||= {});

  if (globalCache.client) return globalCache.client;

  if (!globalCache.promise) {
    const client = new MongoClient(uri);
    globalCache.promise = client.connect().then(() => client);
  }

  globalCache.client = await globalCache.promise;
  return globalCache.client;
}
