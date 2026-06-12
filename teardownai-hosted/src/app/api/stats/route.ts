import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { usersCount, teardownsCount } = await db.getStats();
    return NextResponse.json({
      teardowns: 14000 + teardownsCount,
      users: 5400 + usersCount
    });
  } catch (err: any) {
    console.error('API stats route error:', err.message);
    return NextResponse.json({ teardowns: 14000, users: 5400 });
  }
}
