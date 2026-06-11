import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await db.getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    return NextResponse.json({
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
    console.error('API session route error:', err.message);
    return NextResponse.json({ error: 'Server error during session validation.' }, { status: 500 });
  }
}
