import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
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

    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    user.team = user.team || [
      {
        initials: user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        name: user.name + ' (Admin)',
        email: user.email,
        role: 'admin',
        tears: 0,
        lastActive: 'Online now',
        col: 'ic-g'
      }
    ];

    const lowerEmail = email.toLowerCase().trim();
    const exists = user.team.some(m => m.email?.toLowerCase() === lowerEmail || m.name.toLowerCase() === lowerEmail);
    if (exists) {
      return NextResponse.json({ error: 'Member already in team.' }, { status: 400 });
    }

    const cols = ['ic-b', 'ic-o', 'ic-g'];
    user.team.push({
      initials: lowerEmail[0].toUpperCase(),
      name: lowerEmail.split('@')[0],
      email: lowerEmail,
      role: 'member',
      tears: 0,
      lastActive: 'Invited',
      col: cols[user.team.length % 3]
    });

    await db.saveUser(user);

    return NextResponse.json({ success: true, team: user.team });
  } catch (err: any) {
    console.error('API team invite route error:', err.message);
    return NextResponse.json({ error: 'Server error inviting team member.' }, { status: 500 });
  }
}
