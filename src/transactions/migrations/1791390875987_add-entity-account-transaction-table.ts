import { PgType, type ColumnDefinitions, type MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('entity', {
        id: 'id',
        createdAt: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        modifiedAt: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        providerEntityId: { type: PgType.TEXT },
        transactionsUpdateStatus: { type: PgType.TEXT },
        nextCursor: { type: PgType.TEXT },
        lastRequestId: { type: PgType.TEXT }
    });

    pgm.createTable('account', {
        id: 'id',
        createdAt: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        modifiedAt: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        entityId: {
            type: PgType.INTEGER,
            references: { name: 'entity' },
        },
        providerAccountId: { type: PgType.TEXT },
        name: { type: PgType.TEXT },
        type: { type: PgType.TEXT },
        subtype: { type: PgType.TEXT },
        balance: { type: PgType.INTEGER },
        balanceCurrencyCode: { type: 'varchar(3)' },
    });

    pgm.createTable('transaction', {
        id: 'id',
        createdAt: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        modifiedAt: {
            type: PgType.TIMESTAMP,
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        accountId: {
            type: PgType.INTEGER,
            references: { name: 'account' },
        },
        providerAccountId: { type: PgType.TEXT },
        providerTransactionId: { type: PgType.TEXT },
        amount: { type: PgType.DECIMAL },
        currencyCode: { type: 'varchar(3)' },
        date: { type: PgType.TEXT },
        address: { type: PgType.TEXT },
        city: { type: PgType.TEXT },
        region: { type: PgType.TEXT },
        postalCode: { type: PgType.TEXT },
        countryCode: { type: 'varchar(2)' },
        merchantName: { type: PgType.TEXT },
        originalDescription: { type: PgType.TEXT },
        paymentChannel: { type: PgType.TEXT },
        type: { type: PgType.TEXT },
        merchantEntityId: { type: PgType.TEXT },
        primaryCategory: { type: PgType.TEXT },
        detailedCategory: { type: PgType.TEXT },
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> { }
