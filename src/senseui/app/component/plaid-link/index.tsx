"use client"
import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import Button from '@/app/component/button';

export default function PlaidLink({ onSuccess, onHasPreviousAccessToken, clientId }: { onSuccess: () => void, onHasPreviousAccessToken: () => void, clientId: string }) {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [showConnectButton, setShowConnectButton] = useState(true);

    useEffect(() => {
        const createLinkToken = async () => {
            try {
                const response = await axios.post('/api/plaid/create-link-token', {
                    client_user_id: clientId
                });

                if (response.data.hasAccessToken)
                    onHasPreviousAccessToken();
                else {
                    setLinkToken(response.data.link_token);
                    setShowConnectButton(true);
                }
            } catch (error) {
                console.error('Error generating link token:', error);
            }
        };
        createLinkToken();
    }, [clientId]);
    const onCreateLinkTokenSuccess = async (public_token: string | null) => {
        try {
            const response = await axios.post('/api/plaid/exchange-token', {
                public_token,
            });

            await axios.post('/api/transactions/transactionsSync', {
                accessToken: response.data.access_token,
                itemId: response.data.item_id,
                clientId: clientId
            });

            setShowConnectButton(false);
            onSuccess();
        } catch (error) {
            console.error('Error exchanging public token:', error);
        }
    };
    const { open, ready } = usePlaidLink({
        token: linkToken!,
        onSuccess: onCreateLinkTokenSuccess,
    });
    return (
        <div>
            {linkToken && showConnectButton && (
                <Button onClick={open} disabled={!ready}>Connect Bank</Button>
            )}
        </div>
    );
}