"use client";
import Button from "../button";
import authClient from "./../../auth-client";

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