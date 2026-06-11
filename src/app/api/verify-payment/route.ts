import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json({ error: 'Missing signature details or plan.' }, { status: 400 });
    }

    const RZP_SEC = process.env.RAZORPAY_KEY_SECRET;
    const isMock = razorpay_signature === 'sig_mock_signature' && process.env.NODE_ENV === 'development';

    let isVerified = false;
    if (isMock) {
      isVerified = true;
    } else if (RZP_SEC) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expected = crypto.createHmac('sha256', RZP_SEC).update(body).digest('hex');
      isVerified = (expected === razorpay_signature);
    }

    if (isVerified) {
      const normalizedPlan = plan.toLowerCase();
      user.plan = normalizedPlan === 'pro' ? 'Pro' : (normalizedPlan === 'student' ? 'Student' : 'Free');
      user.credits = normalizedPlan === 'pro' ? 500 : (normalizedPlan === 'student' ? 15 : 10);
      user.maxCreds = user.credits;
      
      await db.saveUser(user);

      return NextResponse.json({
        verified: true,
        plan: user.plan,
        credits: user.credits,
        maxCreds: user.maxCreds
      });
    } else {
      return NextResponse.json({ verified: false, error: 'Signature verification failed' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('API verify-payment route error:', err.message);
    return NextResponse.json({ error: 'Server error during payment verification.' }, { status: 500 });
  }
}
