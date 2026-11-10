"use client";
import Button from "@/app/component/button";
import authClient from "@/app/auth-client";

export default function SignInButton() {
    async function onClick() {
        await authClient.signIn.magicLink(
            {
                email: process.env.NEXT_PUBLIC_LOGIN_EMAIL || '',
                name: process.env.NEXT_PUBLIC_LOGIN_NAME
            },
        );
    }

    return <Button onClick={onClick}>Sign In</Button>;
}