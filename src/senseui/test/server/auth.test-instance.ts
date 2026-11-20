import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";

export const testAuth = betterAuth({
    plugins: [
        testUtils({ captureOTP: true }),
    ],
});