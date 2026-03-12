import { registerAs } from '@nestjs/config';
import { ClientConfig } from '../interfaces/client-config.interface';

export default registerAs(
  'client',
  (): ClientConfig => ({
    type: process.env.CLIENT_TYPE || '',
    timeout: parseInt(process.env.CLIENT_TIMEOUT || '5000', 10),
    baseUrl: '',
  }),
);
