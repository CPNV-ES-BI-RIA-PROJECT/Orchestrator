export type MqttEventType = 'running' | 'completed' | 'failed';

export interface MqttEventPayload {
  schemaVersion: string;
  job_id: string;
  output?: {
    uri: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function buildMqttCommandTopic(
  namespace: string,
  target: string,
  action = 'start',
): string {
  return `etl/${namespace}/${target}/cmd/${action}`;
}

export function buildMqttEventSubscriptionTopic(namespace: string): string {
  return `etl/${namespace}/+/event/+`;
}

export function parseMqttEventPayload(
  message: Buffer,
): MqttEventPayload | null {
  try {
    return JSON.parse(message.toString()) as MqttEventPayload;
  } catch {
    return null;
  }
}

export function extractTargetFromTopic(topic: string): string | null {
  const parts = topic.split('/');
  if (parts.length < 5) {
    return null;
  }

  return parts[2] ?? null;
}

export function extractMqttEventType(topic: string): MqttEventType | null {
  const parts = topic.split('/');
  if (parts.length < 5 || parts[3] !== 'event') {
    return null;
  }

  const eventType = parts[4];
  return eventType === 'running' ||
    eventType === 'completed' ||
    eventType === 'failed'
    ? eventType
    : null;
}

export function getMqttErrorMessage(payload: MqttEventPayload): string {
  return payload.error?.message ?? 'MQTT step failed';
}
