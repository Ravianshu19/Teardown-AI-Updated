import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, User } from '@/lib/db';

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.trim().length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const existingUser = await db.getUser(lowerEmail);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const token = crypto.randomBytes(24).toString('hex');

    const isDeveloper = lowerEmail.endsWith('@teardownai.com') || (lowerEmail.includes('developer') && process.env.NODE_ENV === 'development');
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: User = {
      name,
      email: lowerEmail,
      passwordHash,
      salt,
      token,
      plan: isDeveloper ? 'Pro' : 'Free',
      credits: isDeveloper ? 72 : 10,
      maxCreds: isDeveloper ? 100 : 10,
      reports: isDeveloper
        ? [
            {
              id: 'seed_notion',
              name: 'Notion',
              score: 88,
              score_ux: 85,
              score_market: 82,
              score_moat: 78,
              score_growth: 86,
              score_revenue: 80,
              score_retention: 84,
              date: 'Jun 3, 2025',
              ts: Date.now() - 7200000,
              domain: 'notion.so',
              col: 'ic-o',
              saved: true,
              note: '',
            },
            {
              id: 'seed_stripe',
              name: 'Stripe',
              score: 94,
              score_ux: 90,
              score_market: 88,
              score_moat: 92,
              score_growth: 86,
              score_revenue: 92,
              score_retention: 90,
              date: 'May 28, 2025',
              ts: Date.now() - 86400000,
              domain: 'stripe.com',
              col: 'ic-g',
              saved: true,
              note: 'Great revenue model',
            },
            {
              id: 'seed_figma',
              name: 'Figma',
              score: 91,
              score_ux: 92,
              score_market: 85,
              score_moat: 88,
              score_growth: 84,
              score_revenue: 82,
              score_retention: 89,
              date: 'May 25, 2025',
              ts: Date.now() - 259200000,
              domain: 'figma.com',
              col: 'ic-b',
              saved: false,
              note: '',
            },
          ]
        : [],
      team: isDeveloper
        ? [
            { initials, name: name + ' (Admin)', email: lowerEmail, role: 'admin', tears: 0, lastActive: 'Online now', col: 'ic-g' },
            { initials: 'AR', name: 'Ananya R.', email: 'ananya.r@teardownai.com', role: 'member', tears: 12, lastActive: '1 day ago', col: 'ic-b' },
            { initials: 'MK', name: 'Mohan K.', email: 'mohan.k@teardownai.com', role: 'member', tears: 7, lastActive: '3 days ago', col: 'ic-o' },
          ]
        : [{ initials, name: name + ' (Admin)', email: lowerEmail, role: 'admin', tears: 0, lastActive: 'Online now', col: 'ic-g' }],
    };

    await db.saveUser(newUser);

    return NextResponse.json({
      token,
      name,
      email: lowerEmail,
      plan: newUser.plan,
      credits: newUser.credits,
      maxCreds: newUser.maxCreds,
      team: newUser.team,
    });
  } catch (err: any) {
    console.error('API register route error:', err.message);
    return NextResponse.json({ error: 'Server error during registration.' }, { status: 500 });
  }
}
