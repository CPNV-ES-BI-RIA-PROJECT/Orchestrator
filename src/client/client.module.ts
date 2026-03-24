import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { CLIENT_TOKEN } from './client.constants';
import { HttpClientService } from './http/http-client.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import clientConfig from './config/client.config';
import { IClient } from './interfaces/client.interface';
import { MqttClientService } from './mqtt/mqtt-client.service';

@Module({
  imports: [
    ConfigModule.forFeature(clientConfig),
    HttpModule.registerAsync({
      imports: [ConfigModule.forFeature(clientConfig)],
      inject: [clientConfig.KEY],
      useFactory: (config: ConfigType<typeof clientConfig>) => ({
        timeout: config.timeout,
        baseURL: config.baseUrl,
      }),
    }),
  ],
  providers: [
    {
      provide: CLIENT_TOKEN,
      inject: [clientConfig.KEY, HttpService],
      useFactory: (
        config: ConfigType<typeof clientConfig>,
        httpService: HttpService,
      ): IClient => {
        switch (config.type) {
          case 'http':
            return new HttpClientService(httpService);
          case 'mqtt':
            return new MqttClientService(httpService);
          default:
            throw new Error(
              `No client type was configured or it was spelled incorrectly. Received type: "${config.type}"`,
            );
        }
      },
    },
  ],
  exports: [CLIENT_TOKEN],
})
export class ClientModule {}
