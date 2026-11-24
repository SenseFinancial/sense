import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { returnNullIfAuthorized } from '@/app/auth/utils';
import { generateTransactionsJwt } from '@/app/auth/jwt';

export async function POST(req: NextRequest) {
    const auth = await returnNullIfAuthorized();
    if (auth) return auth;

    try {
        const { clientId } = await req.json();
        const jwt = await generateTransactionsJwt();
        const { data } = await axios.get(
            `${process.env.TRANSACTIONS_ADDRESS}/beginTransactionsSync?clientId=${clientId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            }
        );

        return NextResponse.json({ ...data }, { status: 200 });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response)
                console.log(`Error: ${error.response.data.statusCode} ${error.response.data.error} ${error.response.data.message}.`);
            else
                console.log(`Error: ${error.code} ${error.message}.`);
        } else {
            console.log(error);
        }

        return NextResponse.json({ error: 'Error generating link token.' }, { status: 500 });
    }
}