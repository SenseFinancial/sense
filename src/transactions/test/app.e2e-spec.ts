import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { runner } from 'node-pg-migrate';
import { AppModule } from '../src/app.module';
import { PlaidClientApiWrapperService } from '../src/plaid/plaidClientApiWrapperService';
import { PlaidAuthenticationService } from '../src/plaid/plaidAuthenticationService';
import { Configuration } from '../src/infrastructure/configuration';
import { PoolFactory } from '../src/database/poolFactory';

const data_add_entity_accounts_transactions = require('./data/add_entity_accounts_transactions.json');
const data_update_entity_accounts_transactions_first = require('./data/update_entity_accounts_transactions_first.json');
const data_update_entity_accounts_transactions_second = require('./data/update_entity_accounts_transactions_second.json');
const data_remove_entity_accounts_transactions = require('./data/remove_entity_accounts_transactions.json');

describe('AppController (e2e) with PostgreSQL integration', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let app: INestApplication<App>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const databaseUrl = container.getConnectionUri();
    testingConfiguration.getDatabaseUrl = () => databaseUrl;
    pool = new Pool({ connectionString: databaseUrl });
    testingPoolFactory.getPool = () => { return pool; };

    await runner({
      databaseUrl: databaseUrl,
      dir: `./migrations`,
      migrationsTable: 'pgmigrations',
      direction: 'up',
      verbose: true,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PoolFactory)
      .useValue(testingPoolFactory)
      .overrideProvider(Configuration)
      .useValue(testingConfiguration)
      .overrideProvider(PlaidClientApiWrapperService)
      .useValue(testingPlaidClientApiWrapperService)
      .overrideProvider(PlaidAuthenticationService)
      .useValue(testingPlaidAuthenticationService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
    await container.stop();
  });

  afterEach(async () => {
    await pool.query(`TRUNCATE TABLE entity RESTART IDENTITY CASCADE;`);
  });

  it('add entity, add accounts, add transactions', async () => {
    testingPlaidClientApiWrapperService.transactionsSync = () => Promise.resolve(data_add_entity_accounts_transactions);

    await request(app.getHttpServer())
      .get('/')
      .expect(200);

    const entityResp = await pool.query(`SELECT * FROM entity where "providerEntityId" = 'sandBoxItemId'`);
    expect(entityResp.rowCount).toEqual(1);
    expect(entityResp.rows[0].providerEntityId).toEqual('sandBoxItemId');
    expect(entityResp.rows[0].transactionsUpdateStatus).toEqual('HISTORICAL_UPDATE_COMPLETE');
    expect(entityResp.rows[0].nextCursor).toEqual('CAESJXZRb2pvNWdRejhVZ2R3QVp4RE5FRjVhcmp5MUxlZHRxUG80NHcaDAjBm6jXBhCIzLGoAyIMCMGbqNcGEIjMsagDKgwIwZuo1wYQiMyxqAM=');
    expect(entityResp.rows[0].lastRequestId).toEqual('a95aa5bfa73a416');

    const accountResp = await pool.query(`SELECT * FROM account WHERE "entityId" = $1`, [entityResp.rows[0].id]);
    expect(accountResp.rowCount).toEqual(5);

    const oneAccount = accountResp.rows.find((row: any) => row.providerAccountId === "EXdydNVXxkHqDKJp3ZykfAJRoggbZgHg9abKW");
    expect(oneAccount.name).toEqual('Plaid Checking');
    expect(oneAccount.type).toEqual('depository');
    expect(oneAccount.subtype).toEqual('checking');
    expect(oneAccount.balance).toEqual(110);
    expect(oneAccount.balanceCurrencyCode).toEqual('CAD');

    const twoAccount = accountResp.rows.find((row: any) => row.providerAccountId === "WnWQW8XnEPI1oGJ3yeRkijE98ww4WwFPwdgmL");
    expect(twoAccount.name).toEqual('Plaid Saving');

    const threeAccount = accountResp.rows.find((row: any) => row.providerAccountId === "AXzGzQwXrBHzN1E8Dg6KfPBnDaaRAai46bz7g");
    expect(threeAccount.name).toEqual('Plaid CD');

    const fourAccount = accountResp.rows.find((row: any) => row.providerAccountId === "GX4l43nXaNHrLNajvkZKU6gB4yyzKyCGAVklm");
    expect(fourAccount.name).toEqual('Plaid Credit Card');

    const fiveAccount = accountResp.rows.find((row: any) => row.providerAccountId === "nd7k7pRdo8s5lxWVeBgGtvmq1778d7f3Kavdv");
    expect(fiveAccount.name).toEqual('Plaid Money Market');

    const transactionsResp = await pool.query(`SELECT * FROM transaction`);
    expect(transactionsResp.rowCount).toEqual(48);

    const oneTransaction = transactionsResp.rows.find(row => row.providerTransactionId === "gqxyxAMqemuR5aGgQ1vEu7AWDzB7pmcE4485D");
    expect(oneTransaction.accountId).toEqual(oneAccount.id);
    expect(oneTransaction.providerAccountId).toEqual('EXdydNVXxkHqDKJp3ZykfAJRoggbZgHg9abKW');
    expect(oneTransaction.amount).toEqual("6.33"); // node-postgres intentionally makes this a string to prevent precision loss
    expect(oneTransaction.currencyCode).toEqual('CAD');
    expect(oneTransaction.date).toEqual('2026-10-24');
    expect(oneTransaction.address).toEqual('123 Somewhere St');
    expect(oneTransaction.city).toEqual('Vancouver');
    expect(oneTransaction.region).toEqual('BC');
    expect(oneTransaction.postalCode).toEqual('V1V 1V1');
    expect(oneTransaction.countryCode).toEqual('CA');
    expect(oneTransaction.merchantName).toEqual('Uber');
    expect(oneTransaction.originalDescription).toEqual('Uber 072515 SF**POOL**');
    expect(oneTransaction.paymentChannel).toEqual('online');
    expect(oneTransaction.type).toEqual('code');
    expect(oneTransaction.merchantEntityId).toEqual('eyg8o776k0QmNgVpAmaQj4WgzW9Qzo6O51gdd');
    expect(oneTransaction.primaryCategory).toEqual('TRANSPORTATION');
    expect(oneTransaction.detailedCategory).toEqual('TRANSPORTATION_TAXIS_AND_RIDE_SHARES');
  });

  it('updates entity, updates accounts, updates transactions', async () => {
    testingPlaidClientApiWrapperService.transactionsSync = (accessToken, cursor) => {
      if (cursor === null)
        return Promise.resolve(data_update_entity_accounts_transactions_first);
      else
        return Promise.resolve(data_update_entity_accounts_transactions_second);
    }

    await request(app.getHttpServer())
      .get('/')
      .expect(200);

    const entityResp = await pool.query(`SELECT * FROM entity where "providerEntityId" = 'sandBoxItemId'`);
    expect(entityResp.rowCount).toEqual(1);
    expect(entityResp.rows[0].providerEntityId).toEqual('sandBoxItemId');
    expect(entityResp.rows[0].transactionsUpdateStatus).toEqual('HISTORICAL_UPDATE_COMPLETE');
    expect(entityResp.rows[0].nextCursor).toEqual('it is a cursor!'); // this changed between first and second
    expect(entityResp.rows[0].lastRequestId).toEqual('a95aa5bfa73a416');

    const accountResp = await pool.query(`SELECT * FROM account WHERE "entityId" = $1`, [entityResp.rows[0].id]);
    expect(accountResp.rowCount).toEqual(1);
    expect(accountResp.rows[0].name).toEqual('Plaid Checking1');
    expect(accountResp.rows[0].type).toEqual('depository1');
    expect(accountResp.rows[0].subtype).toEqual('checking1');
    expect(accountResp.rows[0].balance).toEqual(130);
    expect(accountResp.rows[0].balanceCurrencyCode).toEqual('CA1');

    const transactionsResp = await pool.query(`SELECT * FROM transaction`);
    expect(transactionsResp.rowCount).toEqual(1);
    expect(transactionsResp.rows[0].accountId).toEqual(accountResp.rows[0].id);
    expect(transactionsResp.rows[0].providerAccountId).toEqual('EXdydNVXxkHqDKJp3ZykfAJRoggbZgHg9abKW');
    expect(transactionsResp.rows[0].amount).toEqual("8"); // node-postgres intentionally makes this a string to prevent precision loss
    expect(transactionsResp.rows[0].currencyCode).toEqual('CA1');
    expect(transactionsResp.rows[0].date).toEqual('2026-10-25');
    expect(transactionsResp.rows[0].address).toEqual('123 Elsewhere St');
    expect(transactionsResp.rows[0].city).toEqual('Vancouver1');
    expect(transactionsResp.rows[0].region).toEqual('BC1');
    expect(transactionsResp.rows[0].postalCode).toEqual('V2V 2V2');
    expect(transactionsResp.rows[0].countryCode).toEqual('C1');
    expect(transactionsResp.rows[0].merchantName).toEqual('Uber1');
    expect(transactionsResp.rows[0].originalDescription).toEqual('Uber 072515 SF**POOL**1');
    expect(transactionsResp.rows[0].paymentChannel).toEqual('online1');
    expect(transactionsResp.rows[0].type).toEqual('code1');
    expect(transactionsResp.rows[0].merchantEntityId).toEqual('merchant ID!');
    expect(transactionsResp.rows[0].primaryCategory).toEqual('TRANSPORTATION1');
    expect(transactionsResp.rows[0].detailedCategory).toEqual('TRANSPORTATION_TAXIS_AND_RIDE_SHARES1');
  });

  it('removes transactions', async () => {
    testingPlaidClientApiWrapperService.transactionsSync = () => Promise.resolve(data_remove_entity_accounts_transactions);

    await request(app.getHttpServer())
      .get('/')
      .expect(200);

    const entityResp = await pool.query(`SELECT * FROM entity where "providerEntityId" = 'sandBoxItemId'`);
    expect(entityResp.rowCount).toEqual(1);

    const accountResp = await pool.query(`SELECT * FROM account WHERE "entityId" = $1`, [entityResp.rows[0].id]);
    expect(accountResp.rowCount).toEqual(1);

    // Transaction is added and removed in the same cursor/process/call
    const transactionsResp = await pool.query(`SELECT * FROM transaction`);
    expect(transactionsResp.rowCount).toEqual(0);
  });

  let testingConfiguration = {
    getDatabaseUrl: () => { }
  };

  let testingPoolFactory = {
    getPool: () => { },
    shutdownPool: () => { } // don't end pool at app shutdown, test will manage it
  };

  let testingPlaidAuthenticationService = {
    getSandboxMetaData: () => {
      return { accessToken: 'sandBoxAccessToken', itemId: 'sandBoxItemId' };
    }
  };

  let testingPlaidClientApiWrapperService = {
    // Only have to stub this one, because we stubbed all of the PlaidAuthenticationService (which calls the authentication methods on wrapper)
    transactionsSync: (accessToken: string, cursor: string) => { }
  };
});
