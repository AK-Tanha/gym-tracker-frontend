import { Collection, Filter, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    if (!MONGODB_URI) {
      throw new Error("Missing MONGODB_URI environment variable");
    }
    clientPromise = new MongoClient(MONGODB_URI).connect();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db("gym-tracker");
}

export function stripMongoId<T extends Record<string, unknown>>(
  doc: T
): Omit<T, "_id"> {
  const { _id, ...data } = doc;
  void _id;
  return data;
}

export async function getCollection(
  name: string
): Promise<Collection<Record<string, any> & { _id?: unknown }>> {
  const db = await getDb();
  return db.collection<Record<string, any> & { _id?: unknown }>(name);
}

// The driver types `_id` filters as ObjectId even when storing string ids.
export function stringIdFilter(id: string): Filter<Record<string, any> & { _id?: unknown }> {
  return { _id: id } as unknown as Filter<Record<string, any> & { _id?: unknown }>;
}