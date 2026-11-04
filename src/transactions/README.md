## Testing
`npm run test:e2e` for e2e tests which spin up a postgres container and run against it with fake data from Plaid (etc) data providers.

## Migrations
Migrations are hand-coded and not automatically run.

https://salsita.github.io/node-pg-migrate/getting-started

`npm run db:create` to create the database before running migrations.
`npm run db:migrate create my-first-migration` to make a new migration.
`npm run db:migrate up` to run all pending migrations.

Uses DATABASE_URL environment variable.