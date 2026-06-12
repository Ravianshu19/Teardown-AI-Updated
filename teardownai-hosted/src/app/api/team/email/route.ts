import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await db.getUserByToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const targetEmail = decodeURIComponent(params.email).toLowerCase().trim();
    user.team = (user.team || []).filter(
      m => m.role === 'admin' || (m.email ? m.email.toLowerCase() !== targetEmail : m.name.toLowerCase() !== targetEmail)
    );

    await db.saveUser(user);

    return NextResponse.json({ success: true, team: user.team });
  } catch (err: any) {
    console.error('API team remove route error:', err.message);
    return NextResponse.json({ error: 'Server error removing team member.' }, { status: 500 });
  }
}
