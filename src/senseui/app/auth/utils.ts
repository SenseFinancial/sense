import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from './auth';

export async function returnNullIfAuthorized() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session)
        return NextResponse.json("Unauthorized", { status: 401 });
    else
        return null;
}