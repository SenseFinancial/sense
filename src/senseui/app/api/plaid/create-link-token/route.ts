import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import axios from 'axios';
import { returnNullIfAuthorized } from '@/app/auth/utils';
import { generateTransactionsJwt } from '@/app/auth/jwt';

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
        const { clientId } = await req.json();
        const jwt = await generateTransactionsJwt();

        const accessTokenResponse = await axios.get(
            `${process.env.TRANSACTIONS_ADDRESS}/getAccessTokenForClientId?clientId=${clientId}`,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            }
        );

        // At another time we will want to allow connecting another bank account so this line may need to change
        if (accessTokenResponse.data)
            return NextResponse.json({ link_token: null, hasAccessToken: true });

        const response = await client.linkTokenCreate({
            user: { client_user_id: clientId },
            client_name: 'Sense',
            products: [
                Products.Transactions,
            ],
            country_codes: [CountryCode.Ca],
            language: 'en'
        });
        return NextResponse.json({ link_token: response.data.link_token });
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