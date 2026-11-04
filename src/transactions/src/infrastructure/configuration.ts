import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class Configuration {
    databaseUrl: string | undefined;
    plaidEnv: string | undefined;
    plaidClientId: string | undefined;
    plaidSecretProduction: string | undefined;
    plaidSecretSandbox: string | undefined;

    constructor(private readonly configService: ConfigService) {
        this.databaseUrl = configService.get<string>("DATABASE_URL");
        this.plaidEnv = configService.get<string>('PLAID_ENV');
        this.plaidClientId = configService.get<string>('PLAID_CLIENT_ID');
        this.plaidSecretProduction = configService.get<string>('PLAID_SECRET_PRODUCTION');
        this.plaidSecretSandbox = configService.get<string>('PLAID_SECRET_SANDBOX');;
    }

    getDatabaseUrl = () => {
        return this.databaseUrl;
    }

    getPlaidEnv = () => {
        return this.plaidEnv;
    }

    getPlaidClientId = () => {
        return this.plaidClientId;
    }

    getPlaidSecretProduction = () => {
        return this.plaidSecretProduction;
    }

    getPlaidSecretSandbox = () => {
        return this.plaidSecretSandbox;
    }
}