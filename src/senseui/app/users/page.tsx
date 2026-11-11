"use client"
import { useState } from 'react';
import { QRCodeSVG } from "qrcode.react";
import Button from "@/app/component/button";
import CheckSignIn from "@/app/component/check-sign-in"
import authClient from '@/app/auth-client';
import axios from 'axios';

export default function UsersPage() {
    const [totpUri, setTotpUri] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const { data: session } = authClient.useSession();
    const isMfaEnabled = session?.user?.twoFactorEnabled;

    async function onEnableMfaClick() {
        const { data, error } = await authClient.twoFactor.enable({ method: "totp" });
        if (error) {
            console.log(error);
        } else if (data && data.method === "totp") {
            setTotpUri(data.totpURI);
        }
    }

    async function onDisableMfaClick() {
        await axios.post('/api/auth/disable-mfa', {
            user_id: session?.user.id
        });
        await authClient.revokeSessions();
        authClient.signOut();
    }

    async function onVerifyClick() {
        const { error } = await authClient.twoFactor.verifyTotp({
            code: code,
            trustDevice: true
        });
        if (error) {
            console.log(error);
        }
    };

    async function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.preventDefault();
            await onVerifyClick();
        }
    }

    return (
        <CheckSignIn>
            <div className="p-4">
                {
                    isMfaEnabled
                        ? (
                            <div>
                                <Button onClick={onDisableMfaClick}>Disable MFA</Button>
                            </div>
                        ) : !totpUri ? (
                            <Button onClick={onEnableMfaClick}>Enable MFA</Button>
                        ) : (
                            <div className="max-w-sm rounded overflow-hidden shadow-lg p-4 flex flex-col gap-4 m-auto">
                                <div>Scan with your Authenticator app</div>
                                <QRCodeSVG value={totpUri} size={200} className="ml-3" />

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <Button onClick={onVerifyClick} className="w-fit">Verify</Button>
                            </div>
                        )}
            </div>
        </CheckSignIn>
    );
}