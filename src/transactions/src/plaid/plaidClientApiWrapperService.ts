import { Injectable } from "@nestjs/common";
import { Configuration as PlaidConfiguration, PlaidEnvironments, PlaidApi } from 'plaid';
import { SandboxPublicTokenCreateRequest, ItemPublicTokenExchangeRequest, Products, TransactionsSyncRequest } from 'plaid';
import { Configuration } from "../infrastructure/configuration";

@Injectable()
export class PlaidClientApiWrapperService {
    client: PlaidApi;

    constructor(private readonly configuration: Configuration) {
        const env = configuration.getPlaidEnv();
        const clientId = configuration.getPlaidClientId();
        const secretProduction = configuration.getPlaidSecretProduction();
        const secretSandbox = configuration.getPlaidSecretSandbox();
        const secret = env === 'production' ? secretProduction : secretSandbox;

        const plaidConfiguration = new PlaidConfiguration({
            basePath: PlaidEnvironments[env || ""],
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': clientId,
                    'PLAID-SECRET': secret,
                    'Plaid-Version': '2020-09-14',
                },
            },
        });

        this.client = new PlaidApi(plaidConfiguration);
    }

    sandboxPublicTokenCreate = (institutionId: string, initialProducts: Array<Products>) => {
        const publicTokenRequest: SandboxPublicTokenCreateRequest = {
            institution_id: institutionId,
            initial_products: initialProducts,
        };
        return this.client.sandboxPublicTokenCreate(publicTokenRequest);
    }

    itemPublicTokenExchange = (publicToken: string) => {
        const exchangeRequest: ItemPublicTokenExchangeRequest = {
            public_token: publicToken,
        };
        return this.client.itemPublicTokenExchange(exchangeRequest);
    }

    transactionsSync = (accessToken: string, cursor: string) => {
        const request: TransactionsSyncRequest = {
            access_token: accessToken,
            cursor: cursor,
            options: {
                include_original_description: true,
                days_requested: 365
            }
        };
        return this.client.transactionsSync(request);
    }
}