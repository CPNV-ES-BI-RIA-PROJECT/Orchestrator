import { registerAs } from '@nestjs/config';
import { ClientConfig } from '../interfaces/client-config.interface';

export default registerAs(
  'client',
  (): ClientConfig => ({
    protocol: process.env.CLIENT_PROTOCOL || '',
    http: {
      timeout: parseInt(process.env.CLIENT_TIMEOUT || '5000', 10),
      baseUrl: '',
    },
    mqtt: {
      brokerUrl: process.env.CLIENT_MQTT_BROKER_URL || '',
      namespace: process.env.CLIENT_MQTT_NAMESPACE || '',
      timeout: parseInt(process.env.CLIENT_MQTT_TIMEOUT || '5000', 10),
    },
  }),
);
