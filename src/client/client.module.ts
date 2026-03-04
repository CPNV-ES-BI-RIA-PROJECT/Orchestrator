import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CLIENT_TOKEN } from './client.constants';
import { HttpClientService } from './http/http-client.service';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: CLIENT_TOKEN,
      useClass: HttpClientService,
    },
  ],
  exports: [CLIENT_TOKEN],
})
export class ClientModule {}
