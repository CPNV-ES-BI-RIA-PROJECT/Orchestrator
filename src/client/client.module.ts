import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  CLIENT_TOKEN,
  HTTP_CLIENT,
  MQTT_CLIENT,
  MQTT_COMMAND_PUBLISHER,
  MQTT_CONNECT,
} from './client.constants';
import { HttpClientService } from './http/http-client.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import clientConfig from './config/client.config';
import { IClient } from './interfaces/client.interface';
import { MqttClientService } from './mqtt/mqtt-client.service';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { MqttBrokerConnectionService } from './mqtt/mqtt-broker-connection.service';
import { emitMqttCommand } from './mqtt/mqtt.service';
import { connect as mqttConnect } from 'mqtt';

@Module({
  imports: [
    ConfigModule.forFeature(clientConfig),
    HttpModule.registerAsync({
      imports: [ConfigModule.forFeature(clientConfig)],
      inject: [clientConfig.KEY],
      useFactory: (config: ConfigType<typeof clientConfig>) => ({
        timeout: config.http.timeout,
        baseURL: config.http.baseUrl,
      }),
    }),
  ],
  providers: [
    HttpClientService,
    {
      provide: HTTP_CLIENT,
      useExisting: HttpClientService,
    },
    {
      provide: MQTT_CLIENT,
      inject: [clientConfig.KEY],
      useFactory: (config: ConfigType<typeof clientConfig>) =>
        ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: config.mqtt.brokerUrl,
          },
        }),
    },
    MqttBrokerConnectionService,
    {
      provide: MQTT_COMMAND_PUBLISHER,
      useValue: emitMqttCommand,
    },
    {
      provide: MQTT_CONNECT,
      useValue: mqttConnect,
    },
    MqttClientService,
    {
      provide: CLIENT_TOKEN,
      inject: [clientConfig.KEY, HTTP_CLIENT, MqttClientService],
      useFactory: (
        config: ConfigType<typeof clientConfig>,
        httpClientService: HttpClientService,
        mqttClientService: MqttClientService,
      ): IClient => {
        const protocol = config.protocol;
        switch (protocol) {
          case 'http':
            return httpClientService;
          case 'mqtt':
            return mqttClientService;
          default:
            throw new Error(
              `No client protocol was configured or it was spelled incorrectly. Received protocol: "${protocol}"`,
            );
        }
      },
    },
  ],
  exports: [CLIENT_TOKEN, HttpClientService],
})
export class ClientModule {}
