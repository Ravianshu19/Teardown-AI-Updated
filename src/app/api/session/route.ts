import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeUser } from '@/lib/types';

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

    const sanitized = sanitizeUser(user);

    return NextResponse.json({
      ...sanitized,
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

    const { name } = await req.json();
    const updates: any = {};
    if (name) updates.name = name.trim();

    const updatedUser = await db.updateUser(user.email, updates);
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user profile.' }, { status: 500 });
    }

    const sanitized = sanitizeUser(updatedUser);

    return NextResponse.json({
      success: true,
      ...sanitized,
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
