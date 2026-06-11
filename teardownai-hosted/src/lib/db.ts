import fs from 'fs';
import path from 'path';

// Types representing the database schema
export interface Report {
  id?: string;
  name: string;
  score: number;
  score_ux: number;
  score_market: number;
  score_moat: number;
  score_growth: number;
  score_revenue: number;
  score_retention: number;
  date: string;
  ts: number;
  domain?: string;
  col: string;
  saved: boolean;
  note: string;
  tagline?: string;
  problem?: string;
  users?: string;
  value?: string;
  revenue?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  persona_primary?: any;
  persona_secondary?: any;
  journey?: any[];
  metrics?: any[];
  rice?: any[];
  prd?: any;
  features?: string[];
  isComparison?: boolean;
}

export interface TeamMember {
  initials: string;
  name: string;
  role: string;
  tears: number;
  lastActive: string;
  col: string;
}

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  token?: string;
  plan: string;
  credits: number;
  maxCreds: number;
  reports: Report[];
  team: TeamMember[];
}

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
// MONGODB ADAPTER (Lazy Loaded)
// ────────────────────────────────────────────────────────────────

let cachedMongoClient: any = null;

async function getMongoClient() {
  if (cachedMongoClient) return cachedMongoClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured.');

  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  cachedMongoClient = client;
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

  async getUser(email: string): Promise<User | null> {
    const lowerEmail = email.toLowerCase().trim();
    
    if (this.isCloud()) {
      try {
        const col = await getMongoCollection();
        const doc = await col.findOne({ email: lowerEmail });
        return doc as unknown as User;
      } catch (err) {
        console.error('MongoDB getUser error, falling back:', err);
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
        console.error('MongoDB saveUser error, falling back:', err);
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
        const doc = await col.findOne({ token });
        return doc as unknown as User;
      } catch (err) {
        console.error('MongoDB getUserByToken error, falling back:', err);
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
          { returnDocument: 'after' }
        );
        return result as unknown as User;
      } catch (err) {
        console.error('MongoDB updateUser error, falling back:', err);
      }
    }

    // Local Fallback
    const local = loadLocalDB();
    const user = local.users[lowerEmail];
    if (!user) return null;

    local.users[lowerEmail] = { ...user, ...updates };
    saveLocalDB(local);
    return local.users[lowerEmail];
  }
};
