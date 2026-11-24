import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import TransactionsUpdateStatus from '../transactionsUpdateStatus';
import { returnNullIfAuthorized } from '@/app/auth/utils';
import { generateTransactionsJwt } from '@/app/auth/jwt';

export async function POST(req: NextRequest) {
    const auth = await returnNullIfAuthorized();
    if (auth) return auth;

    try {
        const { accessToken, itemId, clientId } = await req.json();
        const jwt = await generateTransactionsJwt();
        const { data: { transactionsUpdateStatus } } = await axios.get(
            `${process.env.TRANSACTIONS_ADDRESS}/beginTransactionsSync?accessToken=${accessToken}&itemId=${itemId}&clientId=${clientId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            }
        );

        return NextResponse.json({ transactionsUpdateStatus }, { status: 200 });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response)
                console.log(`Error: ${error.response?.data.error_code} ${error.response?.data.error_message}.`);
            else
                console.log(`Error: ${error.code} ${error.message}.`);
        } else {
            console.log(error);
        }

        return NextResponse.json({ error: 'Error generating link token.' }, { status: 500 });
    }
}