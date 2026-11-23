import { returnNullIfAuthorized } from '@/app/auth/utils';
import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import axios from 'axios';

const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET_SANDBOX,
        },
    },
});

const client = new PlaidApi(config);

export async function POST(req: NextRequest) {
    const auth = await returnNullIfAuthorized();
    if (auth) return auth;

    try {
        const { public_token } = await req.json();
        const response = await client.itemPublicTokenExchange({ public_token });
        const { access_token, item_id } = response.data;
        return NextResponse.json({ access_token, item_id });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response)
                console.log(`Error: ${error.response?.data.error_code} ${error.response?.data.error_message}.`);
            else
                console.log(`Error: ${error.code} ${error.message}.`);
        } else {
            console.log(error);
        }
        return NextResponse.json({ error: 'Error exchanging public token' }, { status: 500 });
    }
}