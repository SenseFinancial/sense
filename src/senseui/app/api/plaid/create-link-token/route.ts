import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import axios from 'axios';
import { returnNullIfAuthorized } from '@/app/auth';

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
        const { client_user_id } = await req.json();
        const response = await client.linkTokenCreate({
            user: { client_user_id },
            client_name: 'Sense',
            products: [
                Products.Transactions,
            ],
            country_codes: [CountryCode.Ca],
            language: 'en',
        });
        return NextResponse.json({ link_token: response.data.link_token });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log(`Error: ${error.response?.data.error_code} ${error.response?.data.error_message}.`);
        }
        return NextResponse.json({ error: 'Error generating link token' }, { status: 500 });
    }
}