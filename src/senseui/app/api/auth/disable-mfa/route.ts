import { NextRequest, NextResponse } from 'next/server';
import { pool, returnNullIfAuthorized } from '@/app/auth';

export async function POST(req: NextRequest) {
    const auth = await returnNullIfAuthorized();
    if (auth) return auth;

    const { user_id } = await req.json();
    await pool.query('delete from "twoFactor" where "userId" = $1', [user_id]);
    await pool.query('update public.user set "twoFactorEnabled" = false where id = $1', [user_id]);

    return NextResponse.json({}, { status: 200 });
}