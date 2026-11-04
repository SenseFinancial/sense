import { Injectable } from '@nestjs/common';
import { Products } from 'plaid';
import { PlaidClientApiWrapperService } from './plaidClientApiWrapperService';
import { Logger } from '../infrastructure/logger';

@Injectable()
export class PlaidAuthenticationService {
  constructor(private readonly client: PlaidClientApiWrapperService, private readonly logger: Logger) {
  }

  async getSandboxMetaData(institutionId: string, initialProducts: Array<Products>): Promise<any> {
    this.logger.info(`Starting method getSandboxMetaData for institutionId ${institutionId}.`)
    const publicTokenResponse = await this.client.sandboxPublicTokenCreate(institutionId, initialProducts);
    const publicToken = publicTokenResponse.data.public_token;
    const exchangeTokenResponse = await this.client.itemPublicTokenExchange(publicToken);
    this.logger.info(`Ending method getSandboxMetaData for institutionId ${institutionId}.`);
    return {
      accessToken: exchangeTokenResponse.data.access_token,
      itemId: exchangeTokenResponse.data.item_id
    };
  }
}
