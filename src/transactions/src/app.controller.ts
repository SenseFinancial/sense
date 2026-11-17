import { Controller, Get, Query, Headers, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PlaidTransactionsService } from './plaid/plaidTransactionsService';
import { Authentication } from './infrastructure/authentication';
import { JOSEError } from 'jose/errors';

@Controller()
export class AppController {
  constructor(private readonly transactionsService: PlaidTransactionsService, private readonly authentication: Authentication) { }

  @Get('beginTransactionsSync')
  async beginTransactionsSync(@Headers('authorization') token: string, @Query('accessToken') accessToken: string, @Query('itemId') itemId: string) {
    try {
      await this.authentication.verifyJwt(token);

      const status = await this.transactionsService.transactionsSync(accessToken, itemId);
      return {
        transactionsUpdateStatus: status
      };
    } catch (error) {
      if (error instanceof JOSEError) {
        console.log(error);
        throw new UnauthorizedException('Authentication failed');
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to sync transactions.');
    }
  }
}
