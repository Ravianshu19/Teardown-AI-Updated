import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await db.getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const reportId = params.id;
    user.reports = (user.reports || []).filter(r => r.id !== reportId);
    
    await db.saveUser(user);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API DELETE report route error:', err.message);
    return NextResponse.json({ error: 'Server error deleting report.' }, { status: 500 });
  }
}
