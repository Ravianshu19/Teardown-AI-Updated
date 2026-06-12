import { User } from './types';

// ────────────────────────────────────────────────────────────────
// MONGODB ADAPTER (Lazy Loaded & Globally Cached)
// ────────────────────────────────────────────────────────────────

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: any;
};

async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured. MongoDB is strictly required.');

  const { MongoClient } = await import('mongodb');

  let client = globalWithMongo._mongoClient;
  let isConnected = false;
  if (client) {
    try {
      await client.db().command({ ping: 1 });
      isConnected = true;
    } catch (e) {
      isConnected = false;
    }
  }

  if (!client || !isConnected) {
    client = new MongoClient(uri);
    await client.connect();
    globalWithMongo._mongoClient = client;
  }

  return client;
}

async function getMongoCollection() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB_NAME || 'teardownai';
  return client.db(dbName).collection('users');
}

// ────────────────────────────────────────────────────────────────
// UNIFIED DATABASE API (MongoDB Only)
// ────────────────────────────────────────────────────────────────

export const db = {
  isCloud(): boolean {
    return true; // Strictly cloud-only now
  },

  async getStats(): Promise<{ usersCount: number; teardownsCount: number }> {
    try {
      const col = await getMongoCollection();
      const usersCount = await col.countDocuments();
      const reportsAggregation = await col.aggregate([
        { $project: { reportsCount: { $size: { $ifNull: [ "$reports", [] ] } } } },
        { $group: { _id: null, total: { $sum: "$reportsCount" } } }
      ]).toArray();
      const teardownsCount = reportsAggregation[0]?.total || 0;
      return { usersCount, teardownsCount };
    } catch (err) {
      console.error('MongoDB getStats error:', err);
      throw err;
    }
  },

  async getUser(email: string): Promise<User | null> {
    const lowerEmail = email.toLowerCase().trim();
    try {
      const col = await getMongoCollection();
      const doc = await col.findOne({ email: lowerEmail }, { projection: { _id: 0 } });
      return doc as unknown as User;
    } catch (err) {
      console.error('MongoDB getUser error:', err);
      throw err;
    }
  },

  async saveUser(user: User): Promise<void> {
    const lowerEmail = user.email.toLowerCase().trim();
    user.email = lowerEmail;
    try {
      const col = await getMongoCollection();
      await col.updateOne(
        { email: lowerEmail },
        { $set: user },
        { upsert: true }
      );
      return;
    } catch (err) {
      console.error('MongoDB saveUser error:', err);
      throw err;
    }
  },

  async getUserByToken(token: string): Promise<User | null> {
    if (!token) return null;
    try {
      const col = await getMongoCollection();
      const doc = await col.findOne({ token }, { projection: { _id: 0 } });
      return doc as unknown as User;
    } catch (err) {
      console.error('MongoDB getUserByToken error:', err);
      throw err;
    }
  },

  async updateUser(email: string, updates: Partial<User>): Promise<User | null> {
    const lowerEmail = email.toLowerCase().trim();
    try {
      const col = await getMongoCollection();
      const result = await col.findOneAndUpdate(
        { email: lowerEmail },
        { $set: updates },
        { projection: { _id: 0 }, returnDocument: 'after' }
      );
      return result as unknown as User;
    } catch (err) {
      console.error('MongoDB updateUser error:', err);
      throw err;
    }
  },

  async deleteUser(email: string): Promise<void> {
    const lowerEmail = email.toLowerCase().trim();
    try {
      const col = await getMongoCollection();
      await col.deleteOne({ email: lowerEmail });
      return;
    } catch (err) {
      console.error('MongoDB deleteUser error:', err);
      throw err;
    }
  }
};
