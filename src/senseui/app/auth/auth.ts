import { betterAuth } from "better-auth";
import { magicLink, twoFactor } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import AuthDatabase from "./authDatabase";

const twoFactorPlugin = twoFactor({
    allowPasswordless: true
});

export const auth = betterAuth({
    appName: "Sense",
    database: AuthDatabase.getInstance().getPool(),
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, token, url, metadata }, ctx) => {
                // Don't want to deal with actually e-mailing right now
                const enabled = await AuthDatabase.getInstance().isTwoFactorEnabledForEmail(email);
                if (enabled)
                    console.log(`URL:https://localhost:3000/magic-link-verify?token=${token}`)
                else
                    console.log(`URL:${url}`);
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