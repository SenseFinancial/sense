"use client"
import { useState, useEffect, useRef } from 'react';
import { PlaidLinkError, PlaidLinkOnEventMetadata, PlaidLinkOnExitMetadata, PlaidLinkStableEvent, usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import Button from '@/app/component/button';
import PlaidLinkErrors from './errors';

export default function PlaidLink({ onSuccess, onNonSuccess, clientId }: { onSuccess: () => void, onNonSuccess: (message: string) => void, clientId: string }) {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [showConnectButton, setShowConnectButton] = useState(true);
    const isExchanging = useRef(false);

    useEffect(() => {
        const createLinkToken = async () => {
            try {
                const response = await axios.post('/api/plaid/create-link-token', {
                    client_user_id: clientId
                });

                if (response.data.hasAccessToken)
                    onNonSuccess('You have previously connected your bank account and during this prototype you cannot connect another!');
                else if (response.data.error) {
                    onNonSuccess('There was an error generating a link token to use Plaid.');
                } else {
                    setLinkToken(response.data.link_token);
                    setShowConnectButton(true);
                }
            } catch (error) {
                onNonSuccess('There was an error generating a link token to use Plaid.');
            }
        };
        createLinkToken();
    }, [clientId]);

    const onCreateLinkTokenSuccess = async (public_token: string | null) => {
        try {
            if (!public_token || isExchanging.current) return;
            isExchanging.current = true;

            const response = await axios.post('/api/plaid/exchange-token', {
                public_token,
            });

            if (response.data.error) {
                onNonSuccess('There was an error getting an access token to use Plaid.');
            } else {
                await axios.post('/api/transactions/transactionsSync', {
                    accessToken: response.data.access_token,
                    itemId: response.data.item_id,
                    clientId: clientId
                });

                setShowConnectButton(false);
                onSuccess();
            }
        } catch (error: any) {
            onNonSuccess('There was an error getting an access token to use Plaid.');
        } finally {
            isExchanging.current = false;
        }
    };

    const onExit = function (error: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) {
        if (error != null) {
            onNonSuccess(PlaidLinkErrors[error.error_code]);
        }
    };

    const onEvent = async (
        eventName: PlaidLinkStableEvent | string,
        metadata: PlaidLinkOnEventMetadata
    ) => {
        if (eventName === 'ERROR' && metadata.error_code != null) {
            onNonSuccess(PlaidLinkErrors[metadata.error_code]);
        }
    };

    const { open, ready } = usePlaidLink({
        token: linkToken!,
        onSuccess: onCreateLinkTokenSuccess,
        onExit: onExit,
        onEvent: onEvent
    });
    return (
        <div>
            {linkToken && showConnectButton && (
                <Button onClick={open} disabled={!ready}>Connect Bank</Button>
            )}
        </div>
    );
}