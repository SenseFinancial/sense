import { Pool } from 'pg';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Transaction as PlaidTransaction, AccountBase as PlaidAccount, RemovedTransaction } from 'plaid';
import { Logger } from '../infrastructure/logger';
import { PoolFactory } from './poolFactory';

@Injectable()
export class Database implements OnApplicationShutdown {
    pool: Pool;

    constructor(private readonly poolFactory: PoolFactory, private readonly logger: Logger) {
        this.pool = poolFactory.getPool();
    }

    async onApplicationShutdown(signal?: string) {
        await this.poolFactory.shutdownPool();
    }

    getLatestCursorOrNullForProviderEntityId = async (providerEntityId: string) => {
        const res = await this.pool.query(
            'SELECT "nextCursor" FROM public.entity WHERE "providerEntityId" = $1',
            [providerEntityId]);
        if (res.rowCount === 0) return null;
        return res.rows[0];
    };

    setNextCursorForProviderEntityId = async (providerEntityId: string, nextCursor: string) => {
        await this.pool.query(
            'UPDATE entity SET "nextCursor" = $2 WHERE "providerEntityId" = $1',
            [providerEntityId, nextCursor]
        )
    }

    addOrUpdateEntity = async (providerEntityId: string, transactionsUpdateStatus: string, nextCursor: string, lastRequestId: string) => {
        const res = await this.pool.query(`SELECT EXISTS(
                SELECT 1 
                FROM entity 
                WHERE "providerEntityId" = $1
            );`, [providerEntityId]);
        if (res.rows[0].exists) {
            const ret = await this.pool.query(
                `UPDATE entity SET
                    "transactionsUpdateStatus" = $2,
                    "nextCursor" = $3,
                    "lastRequestId" = $4,
                    "modifiedAt" = CURRENT_TIMESTAMP
                WHERE "providerEntityId" = $1
                RETURNING id`,
                [providerEntityId, transactionsUpdateStatus, nextCursor, lastRequestId]
            );
            return ret.rows[0].id;
        } else {
            const ret = await this.pool.query(
                'INSERT INTO entity("providerEntityId", "transactionsUpdateStatus", "nextCursor", "lastRequestId") VALUES($1, $2, $3, $4) RETURNING id',
                [providerEntityId, transactionsUpdateStatus, nextCursor, lastRequestId]);
            return ret.rows[0].id;
        }
    };

    addOrUpdateAccounts = async (entityId: number, accounts: PlaidAccount[]) => {
        await Promise.all(accounts.map(async (account) => {
            const res = await this.pool.query(`SELECT EXISTS(
                 SELECT 1 
                 FROM account 
                 WHERE "providerAccountId" = $1
             );`, [account.account_id]);

            if (res.rows[0].exists) {
                await this.pool.query(
                    `UPDATE account SET
                        "entityId" = $2,
                        "modifiedAt" = CURRENT_TIMESTAMP,
                        "name" = $3,
                        "type" = $4,
                        "subtype" = $5,
                        "balance" = $6,
                        "balanceCurrencyCode" = $7
                    WHERE "providerAccountId" = $1`,
                    [account.account_id, entityId, account.name, account.type, account.subtype, account.balances?.current, account.balances?.iso_currency_code]
                );
            } else {
                await this.pool.query(
                    `INSERT INTO account("providerAccountId", "entityId", "name", "type", "subtype", "balance", "balanceCurrencyCode")
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [account.account_id, entityId, account.name, account.type, account.subtype, account.balances?.current, account.balances?.iso_currency_code]
                );
            }
        }));
    };

    bulkAddTransactions = async (transactions: PlaidTransaction[]) => {
        if (transactions.length === 0) return;

        let accountMapSql = 'SELECT id, "providerAccountId" FROM Account WHERE ';
        let count = 1;
        const providerAccountIds: string[] = [];
        let prefix = '';
        transactions.forEach(transaction => {
            accountMapSql += `${prefix} "providerAccountId" = \$${count} `
            count++;
            providerAccountIds.push(transaction.account_id);
            prefix = ' OR ';
        });

        const accountMapResult = await this.pool.query(accountMapSql, providerAccountIds);
        const accountMap: Record<string, number> = {};
        accountMapResult.rows.forEach(row => {
            accountMap[row.providerAccountId] = row.id;
        });

        let insertSql = `INSERT INTO transaction (
            "accountId",
            "providerAccountId",
            "providerTransactionId",
            "amount",
            "currencyCode",
            "date",
            "address",
            "city",
            "region",
            "postalCode",
            "countryCode",
            "merchantName",
            "originalDescription",
            "paymentChannel",
            "type",
            "merchantEntityId",
            "primaryCategory",
            "detailedCategory"
        ) VALUES `;

        await Promise.all(transactions.map(async transaction => {
            await this.pool.query(
                insertSql + "($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
                [
                    accountMap[transaction.account_id],
                    transaction.account_id,
                    transaction.transaction_id,
                    transaction.amount,
                    transaction.iso_currency_code,
                    transaction.date,
                    transaction.location?.address,
                    transaction.location?.city,
                    transaction.location?.region,
                    transaction.location?.postal_code,
                    transaction.location?.country,
                    transaction.merchant_name,
                    transaction.original_description,
                    transaction.payment_channel,
                    transaction.transaction_code,
                    transaction.merchant_entity_id,
                    transaction.personal_finance_category?.primary,
                    transaction.personal_finance_category?.detailed
                ]
            );
        }));
    };

    bulkUpdateTransactions = async (transactions: PlaidTransaction[]) => {
        await Promise.all(transactions.map(async transaction => {
            this.pool.query(`UPDATE transaction SET
                    "amount" = $2,
                    "currencyCode" = $3,
                    "date" = $4,
                    "address" = $5,
                    "city" = $6,
                    "region" = $7,
                    "postalCode" = $8,
                    "countryCode" = $9,
                    "merchantName" = $10,
                    "originalDescription" = $11,
                    "paymentChannel" = $12,
                    "type" = $13,
                    "merchantEntityId" = $14,
                    "primaryCategory" = $15,
                    "detailedCategory" = $16
                WHERE "providerTransactionId" = $1`,
                [
                    transaction.transaction_id,
                    transaction.amount,
                    transaction.iso_currency_code,
                    transaction.date,
                    transaction.location?.address,
                    transaction.location?.city,
                    transaction.location?.region,
                    transaction.location?.postal_code,
                    transaction.location?.country,
                    transaction.merchant_name,
                    transaction.original_description,
                    transaction.payment_channel,
                    transaction.transaction_code,
                    transaction.merchant_entity_id,
                    transaction.personal_finance_category?.primary,
                    transaction.personal_finance_category?.detailed
                ]);
        }));
    };
    bulkRemoveTransactions = async (transactions: RemovedTransaction[]) => {
        await Promise.all(transactions.map(transaction => {
            this.pool.query(
                'DELETE FROM transaction WHERE "providerTransactionId" = $1 AND "providerAccountId" = $2',
                [transaction.transaction_id, transaction.account_id]);
        }));
    };
}

export interface Entity {
    id: number,
    createdAt: string,
    modifiedAt: string,
    providerEntityId: string, // Id from provider
    transactionsUpdateStatus: string, // Plaid values: TRANSACTIONS_UPDATE_STATUS_UNKNOWN, NOT_READY, INITIAL_UPDATE_COMPLETE, HISTORICAL_UPDATE_COMPLETE
    nextCursor: string,
    lastRequestId: string // Plaid returns a request_id and this can be stored in order to improve possible troubleshoot issues. Also probably re-usable because other providers will have a similar it
}

export interface Account {
    id: number,
    entityId: number,
    createdAt: string,
    modifiedAt: string,
    providerAccountId: string, // Id from provider
    name: string,
    type: string, // Plaid values: investment, credit, depository, loan, brokerage, other 
    subtype: string | null, // Plaid values: 401a, 401k, 403B, 457b, 529, auto, brokerage, business, cash isa, cash management, cd, checking, commercial, commercial line of credit, construction, consumer, credit card, crypto exchange, ebt, education savings account, fhsa, fixed annuity, gic, health reimbursement arrangement, home equity, home equity loan, hsa, isa, ira, keogh, lif, life insurance, limited purpose checking, line of credit, lira, loan, lrif, lrsp, money market, mortgage, mutual fund, non-custodial wallet, non-taxable brokerage account, other, other insurance, other annuity, overdraft, paypal, payroll, pension, prediction market, prepaid, prif, profit sharing plan, qshr, rdsp, resp, retirement, rlif, roth, roth 401k, roth 403B, roth 457b, roth pension, roth profit sharing plan, roth thrift savings plan, rrif, rrsp, sarsep, savings, sep ira, simple ira, sipp, stock plan, student, thrift savings plan, tfsa, trust, ugma, utma, variable annuity
    balance: number | null,
    balanceCurrencyCode: string | null
}

export interface Transaction {
    id: number,
    accountId: number,
    createdAt: string,
    modifiedAt: string,
    providerAccountId: string // Id from provider
    providerTransactionId: string, // Id from provider
    amount: number, // positive if money moves into the account, negative if moves out
    currencyCode: string | null,
    date: string,
    address: string | null,
    city: string | null,
    region: string | null, // state/province
    postalCode: string | null,
    countryCode: string | null,
    merchantName: string | null,
    originalDescription: string | null,
    paymentChannel: string, // Plaid (online, in store, other)
    type: string | null, // Plaid transaction_code (adjustment, atm, bank charge, bill payment, cash, cash advance, cashback, cheque, direct debit, interest, late fee, membership fee, payment, purchase, refund, returned item fee, standing order, transfer, null) 
    merchantEntityId: string | null,
    primaryCategory: string | null,
    detailedCategory: string | null
}