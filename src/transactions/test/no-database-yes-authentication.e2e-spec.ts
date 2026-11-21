import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as jose from 'jose';
import { AppModule } from '../src/app.module';
import { PlaidClientApiWrapperService } from '../src/plaid/plaidClientApiWrapperService';
import { Configuration } from '../src/infrastructure/configuration';
import { PlaidTransactionsService } from '../src/plaid/plaidTransactionsService';
import TransactionsUpdateStatus from '../src/transactionsUpdateStatus';

describe('AppController (e2e) no database, testing authentication', () => {
    let app: INestApplication<App>;

    const goodIssuer = "good issuer";
    const goodAudience = "good audience";
    const goodSecret = "good secret";
    const encodedGoodSecret = new TextEncoder().encode(goodSecret);

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PlaidTransactionsService)
            .useValue(testingPlaidTransactionsService)
            .overrideProvider(Configuration)
            .useValue(testingConfiguration)
            .overrideProvider(PlaidClientApiWrapperService)
            .useValue(testingPlaidClientApiWrapperService)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    const urls = [
        '/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId',
        '/getAccessTokenForClientId?clientId=asdf'
    ];

    it('fails when given no jwt token', async () => {
        await Promise.all(urls.map(async (url) => {
            await request(app.getHttpServer())
                .get(url)
                .expect(401);
        }));
    });

    it('fails when given jwt token with bad issuer', async () => {
        await Promise.all(urls.map(async (url) => {
            await getResult('HS256', 'NOT THE ISSUER', goodAudience, encodedGoodSecret, 401, url);
        }));
    });

    it('fails when given jwt token with bad audience', async () => {
        await Promise.all(urls.map(async (url) => {
            await getResult('HS256', goodIssuer, "NOT AUDIENCE", encodedGoodSecret, 401, url);
        }));
    });

    it('fails when given jwt token with bad secret', async () => {
        const badSecret = new TextEncoder().encode(
            "BAD secret"
        );
        await Promise.all(urls.map(async (url) => {
            await getResult('HS256', goodIssuer, goodAudience, badSecret, 401, url);
        }));
    });

    it('fails when given jwt token with bad algorithm', async () => {
        await Promise.all(urls.map(async (url) => {
            await getResult('HS384', goodIssuer, goodAudience, encodedGoodSecret, 401, url);
        }));
    });

    it('succeeds when given jwt token with everything right', async () => {
        await Promise.all(urls.map(async (url) => {
            await getResult('HS256', goodIssuer, goodAudience, encodedGoodSecret, 200, url);
        }));
    });

    async function getResult(algorithm: string, issuer: string, audience: string, secret: Uint8Array<ArrayBuffer>, expect: number, url: string) {
        const token = await new jose.SignJWT()
            .setProtectedHeader({ alg: algorithm })
            .setIssuedAt()
            .setIssuer(issuer)
            .setAudience(audience)
            .setExpirationTime('15m')
            .sign(secret);

        return await request(app.getHttpServer())
            .get(url)
            .set('Authorization', `Bearer ${token}`)
            .expect(expect);
    }

    let testingConfiguration = {
        getDatabaseUrl: () => { },
        getEncryptionKey: () => 'encryption yay',
        getJwtSecret: () => goodSecret,
        getJwtIssuer: () => goodIssuer,
        getJwtAudience: () => goodAudience
    };

    let testingPlaidTransactionsService = {
        transactionsSync: () => Promise.resolve(TransactionsUpdateStatus.HistoricalUpdateComplete),
        getAccessTokenForClientId: () => Promise.resolve('asdf')
    };

    let testingPlaidClientApiWrapperService = {
        transactionsSync: (accessToken: string, cursor: string) => { }
    };
});
