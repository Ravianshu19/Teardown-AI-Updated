import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sanitizeUser } from '@/lib/types';

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
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
    const updatedUser = await db.updateUser(lowerEmail, { token });
    if (!updatedUser) {
      return NextResponse.json({ error: 'Server error during authentication.' }, { status: 500 });
    }

    const sanitized = sanitizeUser(updatedUser);

    const response = NextResponse.json(sanitized);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    return response;
  } catch (err: any) {
    console.error('API login route error:', err.message);
    return NextResponse.json({ error: 'Server error during authentication.' }, { status: 500 });
  }
}
