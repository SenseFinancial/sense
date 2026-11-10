"use client"
import { useState } from 'react';
import { QRCodeSVG } from "qrcode.react";
import Button from "../component/button";
import CheckSignIn from "../component/check-sign-in"
import authClient from './../auth-client';

export default function UsersPage() {
    const [totpUri, setTotpUri] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const { data: session } = authClient.useSession();
    const isMfaEnabled = session?.user?.twoFactorEnabled;

    async function onEnableMfaClick() {
        const { data } = await authClient.twoFactor.enable({ method: "totp" });

        if (data && data.method === "totp")
            setTotpUri(data.totpURI);
    }

    async function onVerifyClick() {
        await authClient.twoFactor.verifyTotp({
            code: code,
            trustDevice: true
        });
    };

    return (
        <CheckSignIn>
            <div className="p-4">
                {
                    isMfaEnabled
                        ? <div>MFA is enabled.</div>
                        : !totpUri ? (
                            <Button onClick={onEnableMfaClick}>Enable MFA</Button>
                        ) : (
                            <div>
                                <p>Scan this QR code with your Authenticator app:</p>
                                <QRCodeSVG value={totpUri} size={200} />

                                <input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                                <button onClick={onVerifyClick}>Verify & Activate</button>
                            </div>
                        )}
            </div>
        </CheckSignIn>
    );
}