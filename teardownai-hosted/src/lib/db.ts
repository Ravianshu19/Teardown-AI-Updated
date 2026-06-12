import fs from 'fs';
import path from 'path';
import { User } from './types';

// ────────────────────────────────────────────────────────────────
// LOCAL FILE DATABASE ADAPTER
// ────────────────────────────────────────────────────────────────

const DB_FILE = path.join(process.cwd(), 'database.json');

function loadLocalDB(): { users: Record<string, User> } {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading JSON database, resetting:', e);
    return { users: {} };
  }
}

function saveLocalDB(data: { users: Record<string, User> }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving JSON database:', e);
  }
}

// ────────────────────────────────────────────────────────────────
// MONGODB ADAPTER (Lazy Loaded & Globally Cached)
// ────────────────────────────────────────────────────────────────

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: any;
};

async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured.');

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
// UNIFIED DATABASE API
// ────────────────────────────────────────────────────────────────

export const db = {
  isCloud(): boolean {
    return !!process.env.MONGODB_URI;
  },

  async getStats(): Promise<{ usersCount: number; teardownsCount: number }> {
    if (this.isCloud()) {
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
        return { usersCount: 0, teardownsCount: 0 };
      }
    }

    const local = loadLocalDB();
    const users = Object.values(local.users);
    const usersCount = users.length;
    const teardownsCount = users.reduce((acc, u) => acc + (u.reports ? u.reports.length : 0), 0);
    return { usersCount, teardownsCount };
  },

  async getUser(email: string): Promise<User | null> {
    const lowerEmail = email.toLowerCase().trim();
    
    if (this.isCloud()) {
      try {
        const col = await getMongoCollection();
        const doc = await col.findOne({ email: lowerEmail }, { projection: { _id: 0 } });
        return doc as unknown as User;
      } catch (err) {
        console.error('MongoDB getUser error:', err);
        throw err;
      }
    }

    // Local Fallback
    const local = loadLocalDB();
    return local.users[lowerEmail] || null;
  },

  async saveUser(user: User): Promise<void> {
    const lowerEmail = user.email.toLowerCase().trim();
    user.email = lowerEmail;

    if (this.isCloud()) {
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
    }

    // Local Fallback
    const local = loadLocalDB();
    local.users[lowerEmail] = user;
    saveLocalDB(local);
  },

  async getUserByToken(token: string): Promise<User | null> {
    if (!token) return null;

    if (this.isCloud()) {
      try {
        const col = await getMongoCollection();
        const doc = await col.findOne({ token }, { projection: { _id: 0 } });
        return doc as unknown as User;
      } catch (err) {
        console.error('MongoDB getUserByToken error:', err);
        throw err;
      }
    }

    // Local Fallback
    const local = loadLocalDB();
    const user = Object.values(local.users).find(u => u.token === token);
    return user || null;
  },

  async updateUser(email: string, updates: Partial<User>): Promise<User | null> {
    const lowerEmail = email.toLowerCase().trim();

    if (this.isCloud()) {
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
    }

    // Local Fallback
    const local = loadLocalDB();
    const user = local.users[lowerEmail];
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    const nextEmail = updatedUser.email.toLowerCase().trim();
    
    if (nextEmail !== lowerEmail) {
      delete local.users[lowerEmail];
    }
    local.users[nextEmail] = updatedUser;
    saveLocalDB(local);
    return local.users[nextEmail];
  },

  async deleteUser(email: string): Promise<void> {
    const lowerEmail = email.toLowerCase().trim();

    if (this.isCloud()) {
      try {
        const col = await getMongoCollection();
        await col.deleteOne({ email: lowerEmail });
        return;
      } catch (err) {
        console.error('MongoDB deleteUser error:', err);
        throw err;
      }
    }

    // Local Fallback
    const local = loadLocalDB();
    delete local.users[lowerEmail];
    saveLocalDB(local);
  }
};
