import { Injectable } from "@nestjs/common";
import { Configuration } from "../infrastructure/configuration";
import { Pool } from "pg";

@Injectable()
export class PoolFactory {
    pool: Pool;

    constructor(private readonly configuration: Configuration) {
        this.pool = new Pool({
            connectionString: configuration.getDatabaseUrl()
        });
    }

    getPool = () => {
        return this.pool;
    }

    shutdownPool = async () => {
        await this.pool.end();
    }
}