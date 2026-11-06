import { Injectable } from '@nestjs/common';
import { PlaidClientApiWrapperService } from './plaidClientApiWrapperService';
import { Database } from '../database/database';
import { Logger } from '../infrastructure/logger';
import { TransactionsUpdateStatus as PlaidTransactionsUpdateStatus } from 'plaid';
import TransactionsUpdateStatus from '../transactionsUpdateStatus';

@Injectable()
export class PlaidTransactionsService {
    constructor(
        private readonly client: PlaidClientApiWrapperService,
        private readonly database: Database,
        private readonly logger: Logger
    ) {
    }

    transactionsSync = async (accessToken: string, itemId: string) => {
        this.logger.info(`Starting method transactionsSync for itemId ${itemId}.`)
        let cursor = await this.database.getLatestCursorOrNullForProviderEntityId(itemId);
        let hasMore = true;
        let transactionsUpdateStatus = '';

        while (hasMore) {
            this.logger.info(`Starting Plaid API call transactionsSync with cursor '${cursor}'.`);
            const response = await this.client.transactionsSync(accessToken, cursor);
            const data = response.data;

            this.logger.info(`Starting sending data to database for itemId ${itemId} with request_id ${data.request_id}. Counts of accounts (${data.accounts.length}), added (${data.added.length}), removed (${data.removed.length}), modified (${data.modified.length}).`);
            const entityId = await this.database.addOrUpdateEntity(itemId, data.transactions_update_status, data.next_cursor, data.request_id, accessToken);
            await this.database.addOrUpdateAccounts(entityId, data.accounts);
            await this.database.bulkAddTransactions(data.added);
            await this.database.bulkUpdateTransactions(data.modified);
            await this.database.bulkRemoveTransactions(data.removed);

            hasMore = data.has_more;
            cursor = data.next_cursor;
            transactionsUpdateStatus = data.transactions_update_status;
        }

        this.logger.info(`Ending method transactionSync for itemId ${itemId}.`);

        // This seems silly, but we want to return *our* status messages to the caller and not Plaid ones.
        switch (transactionsUpdateStatus) {
            case PlaidTransactionsUpdateStatus.NotReady:
                return TransactionsUpdateStatus.NotReady;
            case PlaidTransactionsUpdateStatus.InitialUpdateComplete:
                return TransactionsUpdateStatus.InitialUpdateComplete;
            case PlaidTransactionsUpdateStatus.HistoricalUpdateComplete:
                return TransactionsUpdateStatus.HistoricalUpdateComplete;
            default:
                return TransactionsUpdateStatus.Unknown;
        }
    }
}