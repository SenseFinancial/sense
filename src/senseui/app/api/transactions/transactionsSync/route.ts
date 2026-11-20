import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import TransactionsUpdateStatus from '../transactionsUpdateStatus';
import { returnNullIfAuthorized } from '@/app/auth/utils';
import { generateTransactionsJwt } from '@/app/auth/jwt';

export async function POST(req: NextRequest) {
    const auth = await returnNullIfAuthorized();
    if (auth) return auth;

    try {
        const { accessToken, itemId } = await req.json();
        const jwt = await generateTransactionsJwt();
        const response = await axios.get(
            `${process.env.TRANSACTIONS_ADDRESS}/beginTransactionsSync?accessToken=${accessToken}&itemId=${itemId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            }
        );

        switch (response.data.transactionsUpdateStatus) {
            case TransactionsUpdateStatus.NotReady:
            case TransactionsUpdateStatus.InitialUpdateComplete:
            case TransactionsUpdateStatus.Unknown:
                // do sync again in a moment
                // for Unknown (and the others) ensure we have a threshold breaking point so we aren't looping forever
                break;
            case TransactionsUpdateStatus.HistoricalUpdateComplete:
                // Transactions service has data
                break;
        }

        return NextResponse.json({}, { status: 200 });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response)
                console.log(`Error: ${error.response?.data.error_code} ${error.response?.data.error_message}.`);
            else
                console.log(`Error: ${error.code} ${error.message}.`);
        } else {
            console.log(error);
        }

        return NextResponse.json({ error: 'Error generating link token' }, { status: 500 });
    }
}