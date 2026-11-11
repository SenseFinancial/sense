"use client";
import Button from "@/app/component/button";
import authClient from "@/app/auth-client";

export default function SignInButton({ onClick, disabled }: React.ComponentPropsWithoutRef<'button'>) {
    async function handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        await authClient.signIn.magicLink(
            {
                email: process.env.NEXT_PUBLIC_LOGIN_EMAIL || '',
                name: process.env.NEXT_PUBLIC_LOGIN_NAME
            },
        );
        if (onClick) onClick(event);
    }

    return <Button onClick={handleClick} disabled={disabled}>Sign In</Button>;
}