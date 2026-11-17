import { createAuthClient } from "better-auth/react";
import { magicLinkClient, twoFactorClient } from "better-auth/client/plugins";

export default createAuthClient({
    plugins: [
        magicLinkClient(),
        twoFactorClient()
    ]
})