import { Controller, Get } from '@nestjs/common';
import { Products, Transaction } from 'plaid';
import { PlaidAuthenticationService } from './plaid/plaidAuthenticationService';
import { PlaidTransactionsService } from './plaid/plaidTransactionsService';
import { Database } from './database/database';

@Controller()
export class AppController {
  constructor(private readonly authenticationService: PlaidAuthenticationService, private readonly transactionsService: PlaidTransactionsService, private readonly database: Database) { }

  @Get()
  async transactionsSync() {
    const metaData = await this.authenticationService.getSandboxMetaData("ins_109508", [Products.Transactions]);

    await this.transactionsService.transactionsSync(metaData.accessToken, metaData.itemId); // Sandbox has a specific ItemId, whereas the UI allows us to select one
  }
}
