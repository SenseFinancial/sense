import { Controller, Get, Query, Headers, UnauthorizedException, InternalServerErrorException, Post, Body } from '@nestjs/common';
import { PlaidTransactionsService } from './plaid/plaidTransactionsService';
import { Authentication } from './infrastructure/authentication';
import { JOSEError } from 'jose/errors';
import { PlaidError } from 'plaid';
import AddEntityDto from './dto/AddEntityDto';
import { Logger } from './infrastructure/logger';

@Controller()
export class AppController {
  constructor(private readonly transactionsService: PlaidTransactionsService, private readonly authentication: Authentication, private readonly logger: Logger) { }

  @Get('beginTransactionsSync')
  async beginTransactionsSync(@Headers('authorization') token: string, @Query('clientId') clientId: string) {
    try {
      this.logger.info(`Starting method beginTransactionsSync for clientId ${clientId}.`)
      await this.authentication.verifyJwt(token);

      return await this.transactionsService.transactionsSync(clientId);
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
    } finally {
      this.logger.info(`Ending method beginTransactionsSync for clientId ${clientId}.`);
    }
  }

  @Get('getAccessTokenForClientId')
  async getAccessTokenForClientId(@Headers('authorization') token: string, @Query('clientId') clientId: string) {
    try {
      this.logger.info(`Starting method getAccessTokenForClientId for clientId ${clientId}.`);
      await this.authentication.verifyJwt(token);

      return await this.transactionsService.getAccessTokenForClientId(clientId);
    } catch (error) {
      if (error instanceof JOSEError) {
        console.log(error);
        throw new UnauthorizedException('Authentication failed');
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to get client ID.');
    } finally {
      this.logger.info(`Ending method getAccessTokenForClientId for clientId ${clientId}.`);
    }
  }

  @Post('addEntity')
  async addEntity(@Headers('authorization') token: string, @Body() addEntityDto: AddEntityDto) {
    try {
      this.logger.info(`Starting method addEntity for clientId ${addEntityDto.clientId}.`);
      await this.authentication.verifyJwt(token);

      await this.transactionsService.addEntity(addEntityDto.clientId, addEntityDto.accessToken, addEntityDto.providerEntityId);
    } catch (error) {
      if (error instanceof JOSEError) {
        console.log(error);
        throw new UnauthorizedException('Authentication failed');
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to add entity.');
    } finally {
      this.logger.info(`Ending method addEntity for clientId ${addEntityDto.clientId}.`);
    }
  }
}
