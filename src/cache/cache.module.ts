import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheKeyService } from './cache-key.service';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [ClientModule],
  providers: [CacheService, CacheKeyService],
  exports: [CacheService],
})
export class CacheModule {}
