import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/app/auth';

export async function POST(req: NextRequest) {
    const { user_id } = await req.json();
    await pool.query('delete from "twoFactor" where "userId" = $1', [user_id]);
    await pool.query('update public.user set "twoFactorEnabled" = false where id = $1', [user_id]);

    return NextResponse.json({}, { status: 200 });
}