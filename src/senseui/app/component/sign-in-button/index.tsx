"use client";
import Button from "@/app/component/button";
import authClient from "@/app/auth-client";

export default function SignInButton() {
    async function onClick() {
        await authClient.signIn.magicLink(
            {
                email: "alexis.summer.fleming@gmail.com",
                name: "Alexis"
            },
        );
    }

    return <Button onClick={onClick}>Sign In</Button>;
}