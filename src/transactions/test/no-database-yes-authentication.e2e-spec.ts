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

class UrlData {
    url: string;
    type: string;
    expect: number;
}

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
        { url: '/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId', type: 'get', expect: 200 },
        { url: '/getAccessTokenForClientId?clientId=asdf', type: 'get', expect: 200 },
        { url: '/addEntity', type: 'post', expect: 201 }
    ];

    it('fails when given no jwt token', async () => {
        await Promise.all(urls.map(async (url) => {
            if (url.type === 'get') {
                await request(app.getHttpServer())
                    .get(url.url)
                    .expect(401);
            } else {
                await request(app.getHttpServer())
                    .post(url.url)
                    .expect(401);
            }
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
            await getResult('HS256', goodIssuer, goodAudience, encodedGoodSecret, url.expect, url);
        }));
    });

    async function getResult(algorithm: string, issuer: string, audience: string, secret: Uint8Array<ArrayBuffer>, expect: number, urlData: UrlData) {
        const token = await new jose.SignJWT()
            .setProtectedHeader({ alg: algorithm })
            .setIssuedAt()
            .setIssuer(issuer)
            .setAudience(audience)
            .setExpirationTime('15m')
            .sign(secret);

        if (urlData.type === 'get') {
            return await request(app.getHttpServer())
                .get(urlData.url)
                .set('Authorization', `Bearer ${token}`)
                .expect(expect);
        } else {
            return await request(app.getHttpServer())
                .post(urlData.url)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(expect);
        }
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
        getAccessTokenForClientId: () => Promise.resolve('asdf'),
        addEntity: () => Promise.resolve('')
    };

    let testingPlaidClientApiWrapperService = {
        transactionsSync: (accessToken: string, cursor: string) => { }
    };
});
