"use client"
import { useState } from 'react';
import authClient from '@/app/auth-client';
import SignInButton from "@/app/component/sign-in-button";

export default function CheckSignIn({ children }: { children: React.ReactNode }) {
    const [sentMagicLink, setSentMagicLink] = useState(false);
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return (
        <div className="mx-auto p-4 w-fit">
            Loading...
        </div>
    );

    if (!session) {
        return (
            <div className="mx-auto p-4 w-sm">
                <SignInButton onClick={() => { setSentMagicLink(true) }} disabled={sentMagicLink} />
                {sentMagicLink && (<div>Check console for a link to click to sign in.</div>)}
            </div>
        );
    }

    return children;
}