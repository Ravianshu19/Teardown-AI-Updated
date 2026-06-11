import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
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

    return NextResponse.json({ reports: user.reports || [] });
  } catch (err: any) {
    console.error('API GET reports route error:', err.message);
    return NextResponse.json({ error: 'Server error retrieving reports.' }, { status: 500 });
  }
}

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

    const report = await req.json();
    if (!report || !report.name) {
      return NextResponse.json({ error: 'Invalid report data.' }, { status: 400 });
    }

    if (!report.id) {
      report.id = Date.now().toString() + '_' + crypto.randomBytes(4).toString('hex');
    }
    report.ts = report.ts || Date.now();
    report.date = report.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Decrement user credit only if this is a new report (not an update/re-save)
    const existingReports = user.reports || [];
    const isNewReport = !existingReports.some((r: any) => r.id === report.id || r.name.toLowerCase() === report.name.toLowerCase());

    if (user.credits === undefined) user.credits = 10;
    if (isNewReport && user.credits > 0 && user.plan !== 'Pro') {
      user.credits--;
    }

    // Increment tears count for admin in team
    user.team = user.team || [
      {
        initials: user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        name: user.name + ' (Admin)',
        role: 'admin',
        tears: 0,
        lastActive: 'Online now',
        col: 'ic-g'
      }
    ];

    const admin = user.team.find((m: any) => m.role === 'admin');
    if (admin && isNewReport) {
      admin.tears = (admin.tears || 0) + 1;
    }

    user.reports = (user.reports || []).filter((r: any) => r.id !== report.id && r.name.toLowerCase() !== report.name.toLowerCase());
    user.reports.unshift(report);

    await db.saveUser(user);

    return NextResponse.json({ success: true, report, credits: user.credits });
  } catch (err: any) {
    console.error('API POST reports route error:', err.message);
    return NextResponse.json({ error: 'Server error saving report.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    user.reports = [];
    await db.saveUser(user);

    return NextResponse.json({ success: true, reports: [] });
  } catch (err: any) {
    console.error('API DELETE all reports route error:', err.message);
    return NextResponse.json({ error: 'Server error clearing reports.' }, { status: 500 });
  }
}
