"use client"
import { useState, useEffect, useRef } from 'react';
import { PlaidLinkError, PlaidLinkOnEventMetadata, PlaidLinkOnExitMetadata, PlaidLinkStableEvent, usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import Button from '@/app/component/button';
import PlaidLinkErrors from './errors';
import TransactionsUpdateStatus from '@/app/api/transactions/transactionsUpdateStatus';

export default function PlaidLink({ onSuccess, onNonSuccess, clientId }: { onSuccess: () => void, onNonSuccess: (message: string) => void, clientId: string }) {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [showConnectButton, setShowConnectButton] = useState(true);
    const [showUpdateButton, setShowUpdateButton] = useState(false);
    const isExchanging = useRef(false);

    useEffect(() => {
        const createLinkToken = async () => {
            try {
                const response = await axios.post('/api/plaid/create-link-token', { clientId });

                if (response.data.hasAccessToken) {
                    setShowUpdateButton(true);
                    onNonSuccess('You have previously connected your bank account and during this prototype you cannot connect another!');
                } else if (response.data.error) {
                    setShowConnectButton(false);
                    setShowUpdateButton(false);
                    onNonSuccess('There was an error generating a link token to use Plaid.');
                } else {
                    setLinkToken(response.data.link_token);
                    setShowConnectButton(true);
                    setShowUpdateButton(false);
                }
            } catch (error) {
                onNonSuccess('There was an error generating a link token to use Plaid.');
            }
        };
        createLinkToken();
    }, [clientId]);

    const onCreateLinkTokenSuccess = async (publicToken: string | null) => {
        try {
            if (!publicToken || isExchanging.current) return;
            isExchanging.current = true;

            const response = await axios.post('/api/plaid/exchange-token', {
                publicToken,
                clientId
            });

            if (response.data.error) {
                onNonSuccess('There was an error getting an access token to use Plaid.');
            } else {
                const { data: { transactionsUpdateStatus } } = await axios.post('/api/transactions/transactionsSync', {
                    itemId: response.data.item_id,
                    clientId: clientId
                });

                setShowConnectButton(false);

                switch (transactionsUpdateStatus) {
                    case TransactionsUpdateStatus.NotReady:
                        onNonSuccess("Plaid has started collecting your data but hasn't been able to report to us. Try again in 30 seconds for initial data or 4-5 minutes for all data.");
                        break;
                    case TransactionsUpdateStatus.InitialUpdateComplete:
                        onNonSuccess("Plaid has collected some of your data but hasn't been able to collect the full historical set. Try again in 2-3 minutes.");
                        break;
                    case TransactionsUpdateStatus.HistoricalUpdateComplete:
                        onSuccess();
                        break;
                    case TransactionsUpdateStatus.Unknown:
                        onNonSuccess("Plaid reports an unknown status of collecting your data. Try again in 30 seconds for initial data or 4-5 minutes for all data.")
                        break;
                }
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
            {showUpdateButton && (
                <Button onClick={() => { }} disabled={!ready}>Update Account</Button>
            )}
        </div>
    );
}