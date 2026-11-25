import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class Configuration {
    databaseUrl: string | undefined;
    plaidEnv: string | undefined;
    plaidClientId: string | undefined;
    plaidSecret: string | undefined;
    jwtIssuer: string | undefined;
    jwtAudience: string | undefined;
    jwtSecret: string | undefined;
    encryptionKey: string;

    constructor(private readonly configService: ConfigService) {
        this.databaseUrl = configService.get<string>("DATABASE_URL");
        this.plaidEnv = configService.get<string>('PLAID_ENV');
        this.plaidClientId = configService.get<string>('PLAID_CLIENT_ID');
        this.plaidSecret = configService.get<string>('PLAID_SECRET');
        this.jwtIssuer = configService.get<string>('JWT_ISSUER');
        this.jwtAudience = configService.get<string>('JWT_AUDIENCE');
        this.jwtSecret = configService.get<string>('JWT_SECRET');

        const encryptionKey = configService.get<string>('ENCRYPTION_KEY');
        if (!encryptionKey)
            throw new Error('ENCRYPTION_KEY is empty and must not be.');
        this.encryptionKey = encryptionKey;
    }

    getDatabaseUrl = () => this.databaseUrl;
    getPlaidEnv = () => this.plaidEnv;
    getPlaidClientId = () => this.plaidClientId;
    getPlaidSecret = () => this.plaidSecret;
    getJwtIssuer = () => this.jwtIssuer;
    getJwtAudience = () => this.jwtAudience;
    getJwtSecret = () => this.jwtSecret;
    getEncryptionKey = () => this.encryptionKey;
}