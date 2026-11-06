import { PgType, type ColumnDefinitions, type MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumns(
        'entity',
        {
            'accessToken': { type: PgType.TEXT }
        }
    );
}

export async function down(pgm: MigrationBuilder): Promise<void> { }
