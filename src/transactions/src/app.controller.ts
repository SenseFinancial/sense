import { Controller, Get, Query, Headers, UnauthorizedException, InternalServerErrorException, Post, Body } from '@nestjs/common';
import { PlaidTransactionsService } from './plaid/plaidTransactionsService';
import { Authentication } from './infrastructure/authentication';
import { JOSEError } from 'jose/errors';
import { PlaidError } from 'plaid';
import AddEntityDto from './dto/AddEntityDto';

@Controller()
export class AppController {
  constructor(private readonly transactionsService: PlaidTransactionsService, private readonly authentication: Authentication) { }

  @Get('beginTransactionsSync')
  async beginTransactionsSync(@Headers('authorization') token: string, @Query('accessToken') accessToken: string, @Query('itemId') itemId: string, @Query('clientId') clientId: string) {
    try {
      await this.authentication.verifyJwt(token);

      const status = await this.transactionsService.transactionsSync(accessToken, itemId, clientId);
      return {
        transactionsUpdateStatus: status
      };
    } catch (error: any) {
      console.log(error);
      if (error instanceof JOSEError) {
        throw new UnauthorizedException('Authentication failed');
      }

      const plaidError = error.response?.data as PlaidError | undefined;
      if (plaidError) {
        throw new InternalServerErrorException({
          error: {
            message: plaidError.error_message,
            type: plaidError.error_type,
            code: plaidError.error_code,
            display_message: plaidError.display_message,
          },
        });
      }

      throw new InternalServerErrorException('Failed to sync transactions.');
    }
  }

  @Get('getAccessTokenForClientId')
  async getAccessTokenForClientId(@Headers('authorization') token: string, @Query('clientId') clientId: string) {
    try {
      await this.authentication.verifyJwt(token);

      return await this.transactionsService.getAccessTokenForClientId(clientId);
    } catch (error) {
      if (error instanceof JOSEError) {
        console.log(error);
        throw new UnauthorizedException('Authentication failed');
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to get client ID.');
    }
  }

  @Post('addEntity')
  async addEntity(@Headers('authorization') token: string, @Body() addEntityDto: AddEntityDto) {
    try {
      await this.authentication.verifyJwt(token);

      await this.transactionsService.addEntity(addEntityDto.clientId, addEntityDto.accessToken, addEntityDto.providerEntityId);
    } catch (error) {
      if (error instanceof JOSEError) {
        console.log(error);
        throw new UnauthorizedException('Authentication failed');
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to add entity.');
    }
  }
}
