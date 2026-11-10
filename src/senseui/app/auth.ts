import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { magicLink, twoFactor } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";

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
                // TODO: send email to user
                console.log('EMAIL');
                console.log(email);
                console.log(token);
                console.log(url);
                console.log(metadata);
                console.log(`https://localhost:3000/magic-link-verify?token=${token}`)
            }
        }),
        twoFactor()
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