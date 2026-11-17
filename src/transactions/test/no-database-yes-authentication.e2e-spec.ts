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

describe('AppController (e2e) with PostgreSQL integration', () => {
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

    it('fails when given no jwt token', async () => {
        await request(app.getHttpServer())
            .get('/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId')
            .expect(401);
    });

    it('fails when given jwt token with bad issuer', async () => {
        const badToken = await new jose.SignJWT()
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer('NOT THE ISSUER')
            .setAudience(goodAudience)
            .setExpirationTime('15m')
            .sign(encodedGoodSecret);

        await request(app.getHttpServer())
            .get('/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId')
            .set('Authorization', `Bearer ${badToken}`)
            .expect(401);
    });

    it('fails when given jwt token with bad audience', async () => {
        const badToken = await new jose.SignJWT()
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer(goodIssuer)
            .setAudience("NOT AUDIENCE")
            .setExpirationTime('15m')
            .sign(encodedGoodSecret);

        await request(app.getHttpServer())
            .get('/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId')
            .set('Authorization', `Bearer ${badToken}`)
            .expect(401);
    });

    it('fails when given jwt token with bad secret', async () => {
        const badSecret = new TextEncoder().encode(
            "BAD secret"
        );
        const badToken = await new jose.SignJWT()
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer(goodIssuer)
            .setAudience(goodAudience)
            .setExpirationTime('15m')
            .sign(badSecret);

        await request(app.getHttpServer())
            .get('/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId')
            .set('Authorization', `Bearer ${badToken}`)
            .expect(401);
    });

    it('fails when given jwt token with bad algorithm', async () => {
        const badToken = await new jose.SignJWT()
            .setProtectedHeader({ alg: 'HS384' })
            .setIssuedAt()
            .setIssuer(goodIssuer)
            .setAudience(goodAudience)
            .setExpirationTime('15m')
            .sign(encodedGoodSecret);

        await request(app.getHttpServer())
            .get('/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId')
            .set('Authorization', `Bearer ${badToken}`)
            .expect(401);
    });

    it('succeeds when given jwt token with everything right', async () => {
        const goodToken = await new jose.SignJWT()
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer(goodIssuer)
            .setAudience(goodAudience)
            .setExpirationTime('15m')
            .sign(encodedGoodSecret);

        await request(app.getHttpServer())
            .get('/beginTransactionsSync?accessToken=sandBoxAccessToken&itemId=sandBoxItemId')
            .set('Authorization', `Bearer ${goodToken}`)
            .expect(200);
    });

    let testingConfiguration = {
        getDatabaseUrl: () => { },
        getJwtSecret: () => goodSecret,
        getJwtIssuer: () => goodIssuer,
        getJwtAudience: () => goodAudience
    };

    let testingPlaidTransactionsService = {
        transactionsSync: () => Promise.resolve(TransactionsUpdateStatus.HistoricalUpdateComplete)
    };

    let testingPlaidClientApiWrapperService = {
        transactionsSync: (accessToken: string, cursor: string) => { }
    };
});
