import { PgType, type ColumnDefinitions, type MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.alterColumn('account', 'balance', {
        type: PgType.DECIMAL,
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> { }
