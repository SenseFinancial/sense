import { Controller, Get, Query } from '@nestjs/common';
import { PlaidTransactionsService } from './plaid/plaidTransactionsService';

@Controller()
export class AppController {
  constructor(private readonly transactionsService: PlaidTransactionsService) { }

  @Get('beginTransactionsSync')
  async beginTransactionsSync(@Query('accessToken') accessToken: string, @Query('itemId') itemId: string) {
    const status = await this.transactionsService.transactionsSync(accessToken, itemId);
    return {
      transactionsUpdateStatus: status
    };
  }
}
