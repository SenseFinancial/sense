import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import TransactionsUpdateStatus from '../transactionsUpdateStatus';

export async function POST(req: NextRequest) {
    try {
        const { accessToken, itemId } = await req.json();
        const response = await axios.get(`${process.env.TRANSACTIONS_ADDRESS}/beginTransactionsSync?accessToken=${accessToken}&itemId=${itemId}`);

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

        return NextResponse.json({ link_token: response.data.link_token });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log(`Error: ${error.response?.data.error_code} ${error.response?.data.error_message}.`);
        }
        return NextResponse.json({ error: 'Error generating link token' }, { status: 500 });
    }
}