import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { PlaidAuthenticationService } from './plaid/plaidAuthenticationService';
import { PlaidClientApiWrapperService } from './plaid/plaidClientApiWrapperService';
import { PlaidTransactionsService } from './plaid/plaidTransactionsService';
import { Database } from './database/database';
import { Logger } from './infrastructure/logger';
import { Configuration } from './infrastructure/configuration';
import { Authentication } from './infrastructure/authentication';
import { PoolFactory } from './database/poolFactory';
import { Encryption } from './infrastructure/encryption';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [PlaidAuthenticationService, PlaidClientApiWrapperService, PlaidTransactionsService, Database, Logger, Configuration, PoolFactory, Authentication, Encryption],
})
export class AppModule { }
