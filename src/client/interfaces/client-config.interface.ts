export interface ClientConfig {
  protocol: string;
  http: {
    timeout: number;
    baseUrl: string;
  };
  mqtt: {
    brokerUrl: string;
    namespace: string;
    timeout: number;
  };
}
