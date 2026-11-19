import { NextRequest, NextResponse } from 'next/server';
import { returnNullIfAuthorized } from '@/app/auth/auth';
import AuthDatabase from '@/app/auth/authDatabase';

export async function POST(req: NextRequest) {
    const auth = await returnNullIfAuthorized();
    if (auth) return auth;

    const { user_id } = await req.json();
    AuthDatabase.getInstance().removeTwoFactorForUserId(user_id);

    return NextResponse.json({}, { status: 200 });
}