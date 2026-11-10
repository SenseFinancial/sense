import { Pool } from 'pg';

// Small script to create the database if it doesn't exist.
async function main() {
    let fullConnectionString = process.env.DATABASE_URL;
    const lastIndex = fullConnectionString?.lastIndexOf('/');
    if (lastIndex === undefined || lastIndex < 0) {
        console.log(`Connection string isn't right ${fullConnectionString}.`);
        return;
    }

    const connectionString = fullConnectionString?.substring(0, lastIndex);
    const database = fullConnectionString?.substring(lastIndex + 1);
    console.log(`Creating database "${database}" at "${connectionString}".`)

    const checkPool = new Pool({ connectionString });
    try {
        const checkDbRes = await checkPool.query(
            `SELECT EXISTS(
                SELECT 1 
                FROM pg_database 
                WHERE datname = '${database}'
            );`
        );

        if (!checkDbRes.rows[0].exists) {
            await checkPool.query(`CREATE DATABASE "${database}";`);
        }
    } finally {
        await checkPool.end()
    }
}

// Call the function and handle any top-level rejections
main().catch(err => console.error(err));

