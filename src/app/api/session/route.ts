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
        { initials: user.name.split(' ').map((n: string)=>n[0]).join('').toUpperCase().slice(0,2), name: user.name + ' (Admin)', role: 'admin', tears: 0, lastActive: 'Online now', col: 'ic-g' }
      ],
      razorpayKey: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
    });
  } catch (err: any) {
    console.error('API session route error:', err.message);
    return NextResponse.json({ error: 'Server error during session validation.' }, { status: 500 });
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

    const { name, email } = await req.json();
    const updates: any = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();

    const updatedUser = await db.updateUser(user.email, updates);
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user profile.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      name: updatedUser.name,
      email: updatedUser.email,
      plan: updatedUser.plan || 'Free',
      credits: updatedUser.credits !== undefined ? updatedUser.credits : 10,
      maxCreds: updatedUser.maxCreds || 10,
      team: updatedUser.team || [],
      razorpayKey: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
    });
  } catch (err: any) {
    console.error('API session POST error:', err.message);
    return NextResponse.json({ error: 'Server error during profile update.' }, { status: 500 });
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

    await db.deleteUser(user.email);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API session DELETE error:', err.message);
    return NextResponse.json({ error: 'Server error during account deletion.' }, { status: 500 });
  }
}
