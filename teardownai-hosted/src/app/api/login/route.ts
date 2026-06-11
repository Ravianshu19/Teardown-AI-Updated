import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const user = await db.getUser(lowerEmail);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    const checkHash = hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString('hex');
    await db.updateUser(lowerEmail, { token });

    return NextResponse.json({
      token,
      name: user.name,
      email: user.email,
      plan: user.plan || 'Free',
      credits: user.credits !== undefined ? user.credits : 10,
      maxCreds: user.maxCreds || 10,
      team: user.team || [
        { initials: user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2), name: user.name + ' (Admin)', role: 'admin', tears: 0, lastActive: 'Online now', col: 'ic-g' }
      ]
    });
  } catch (err: any) {
    console.error('API login route error:', err.message);
    return NextResponse.json({ error: 'Server error during authentication.' }, { status: 500 });
  }
}
