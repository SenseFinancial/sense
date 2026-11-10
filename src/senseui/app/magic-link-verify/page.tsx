"use client"
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authClient from "@/app/auth-client";
import Button from '../component/button';

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
        await authClient.magicLink.verify({ query: { token } });
        const { error } = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
        if (error) {
            setError(error.message || '');
            return;
        }
        router.push('/');
    }

    async function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.preventDefault();
            await onSignInClick();
        }
    }

    return token ?
        (
            <div className="max-w-sm rounded overflow-hidden shadow-lg p-4 flex flex-col gap-4 m-auto">
                Enter MFA from Authenticator
                <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <Button onClick={onSignInClick} className="w-fit">Sign In</Button>
            </div >
        )
        : (
            <div>
                {error}
            </div>
        );
}
