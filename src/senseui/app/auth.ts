import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { magicLink, twoFactor } from "better-auth/plugins";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const twoFactorPlugin = twoFactor({
    allowPasswordless: true
});

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
    appName: "Sense",
    database: pool,
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, token, url, metadata }, ctx) => {
                // Don't want to deal with actually e-mailing right now
                const enabled = await pool.query('select "twoFactorEnabled" from public.user where email=$1', [email]);
                if (enabled.rows[0].twoFactorEnabled)
                    console.log(`https://localhost:3000/magic-link-verify?token=${token}`)
                else
                    console.log(url);
            }
        }),
        twoFactorPlugin
    ],
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            // https://github.com/better-auth/better-auth/issues/9552
            if (ctx.path === '/sign-in/magic-link') {
                const response = (await twoFactorPlugin.hooks.after[0].handler(ctx)) as unknown as {
                    response: {
                        twoFactorRedirect?: boolean;
                        twoFactorMethods?: string[];
                    };
                    headers: Headers;
                };
                for (const [key, value] of response.headers.entries()) {
                    ctx.setHeader(key, value);
                }
                return response.response;
            }
        }),
    }
});

export async function returnNullIfAuthorized() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session)
        return NextResponse.json("Unauthorized", { status: 401 });
    else
        return null;
}