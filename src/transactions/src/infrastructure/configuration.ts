import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class Configuration {
    databaseUrl: string | undefined;
    plaidEnv: string | undefined;
    plaidClientId: string | undefined;
    plaidSecretProduction: string | undefined;
    plaidSecretSandbox: string | undefined;
    jwtIssuer: string | undefined;
    jwtAudience: string | undefined;
    jwtSecret: string | undefined;

    constructor(private readonly configService: ConfigService) {
        this.databaseUrl = configService.get<string>("DATABASE_URL");
        this.plaidEnv = configService.get<string>('PLAID_ENV');
        this.plaidClientId = configService.get<string>('PLAID_CLIENT_ID');
        this.plaidSecretProduction = configService.get<string>('PLAID_SECRET_PRODUCTION');
        this.plaidSecretSandbox = configService.get<string>('PLAID_SECRET_SANDBOX');
        this.jwtIssuer = configService.get<string>('JWT_ISSUER');
        this.jwtAudience = configService.get<string>('JWT_AUDIENCE');
        this.jwtSecret = configService.get<string>('JWT_SECRET');
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

    getJwtIssuer = () => {
        return this.jwtIssuer;
    }

    getJwtAudience = () => {
        return this.jwtAudience;
    }

    getJwtSecret = () => {
        return this.jwtSecret;
    }
}