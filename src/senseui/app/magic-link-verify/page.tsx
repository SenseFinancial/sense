"use client"
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authClient from "@/app/auth-client";

export default function MagicLinkVerify() {
    return (
        <Suspense fallback={"Didn't load search params yet"}>
            <CodeInput />
        </Suspense>
    );
}

function CodeInput() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [code, setCode] = useState("");
    const [error, setError] = useState("Invalid login URL, no token.");
    const router = useRouter();

    async function onSignInClick() {
        const { data } = await authClient.magicLink.verify({ query: { token } });

        if (data?.user.twoFactorEnabled) {
            const { error } = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
            if (error) {
                setError(error.message || '');
                return;
            }
        }
        router.push('/');
    }

    return token ?
        (
            <div>
                <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={onSignInClick}>Sign In</button>
            </div >
        )
        : (
            <div>
                {error}
            </div>
        );
}
