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

    transactionsSync = async (clientId: string) => {
        const accessToken = await this.database.getAccessTokenForClientId(clientId);
        if (!accessToken) {
            throw new Error('beginTransactionsSync must be called after creating an initial entity including an access token.');
        }

        const itemId = await this.database.getProviderEntityIdForClientId(clientId);
        let cursor = await this.database.getLatestCursorOrNullForProviderEntityId(itemId);
        let hasMore = true;
        let transactionsUpdateStatus = '';
        let accountCount = 0;
        let addedCount = 0;
        let updateCount = 0;
        let removeCount = 0;

        while (hasMore) {
            this.logger.info(`Starting Plaid API call transactionsSync with cursor '${cursor}'.`);
            const response = await this.client.transactionsSync(accessToken, cursor);
            const data = response.data;

            this.logger.info(`Starting sending data to database for itemId ${itemId} with request_id ${data.request_id}. Counts of accounts (${data.accounts.length}), added (${data.added.length}), removed (${data.removed.length}), modified (${data.modified.length}).`);
            const entityId = await this.database.addOrUpdateEntity(itemId, data.transactions_update_status, data.next_cursor, data.request_id, accessToken, clientId);
            await this.database.addOrUpdateAccounts(entityId, data.accounts);
            await this.database.bulkAddTransactions(data.added);
            await this.database.bulkUpdateTransactions(data.modified);
            await this.database.bulkRemoveTransactions(data.removed);

            hasMore = data.has_more;
            cursor = data.next_cursor;
            transactionsUpdateStatus = data.transactions_update_status;
            accountCount += data.accounts.length;
            addedCount += data.added.length;
            updateCount += data.modified.length;
            removeCount += data.removed.length;
        }

        return {
            transactionsUpdateStatus: this.getTransactionsUpdateStatus(transactionsUpdateStatus),
            metadata: {
                accountCount,
                addedCount,
                updateCount,
                removeCount
            }
        };
    }

    private getTransactionsUpdateStatus = (plaidStatus: string) => {
        // This seems silly, but we want to return *our* status messages to the caller and not Plaid ones.
        switch (plaidStatus) {
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

    getAccessTokenForClientId = async (clientId: string) => {
        return await this.database.getAccessTokenForClientId(clientId);
    };

    addEntity = async (clientId: string, accessToken: string, providerEntityId: string) => {
        await this.database.addOrUpdateEntity(providerEntityId, 'NO_UPDATE_REQUESTED', null, null, accessToken, clientId);
    };
}