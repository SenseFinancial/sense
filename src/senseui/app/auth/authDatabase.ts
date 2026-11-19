import { Pool } from "pg";

class AuthDatabase {
    private readonly pool: Pool;

    private constructor(pool: Pool) {
        this.pool = pool;
    }

    public static getInstance(): AuthDatabase {
        const globalForService = globalThis as unknown as {
            __authDatabase?: AuthDatabase;
        };

        if (!globalForService.__authDatabase) {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
            });
            globalForService.__authDatabase = new AuthDatabase(pool);
        }

        return globalForService.__authDatabase;
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async isTwoFactorEnabledForEmail(email: string): Promise<boolean> {
        const res = await this.pool.query('select "twoFactorEnabled" from public.user where email=$1', [email])
        return res.rows[0].twoFactorEnabled;
    }

    public async removeTwoFactorForUserId(userId: string) {
        await this.pool.query('delete from "twoFactor" where "userId" = $1', [userId]);
        await this.pool.query('update public.user set "twoFactorEnabled" = false where id = $1', [userId]);
    }
}

export default AuthDatabase;