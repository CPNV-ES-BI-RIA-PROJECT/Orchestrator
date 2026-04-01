import hash from 'object-hash';
import { Injectable } from '@nestjs/common';

export interface CacheBusinessRequest {
  payload: string;
  payloadParameters?: Record<string, unknown>;
}

@Injectable()
export class CacheKeyService {
  buildCacheKey(request: CacheBusinessRequest): string {
    return hash(request);
  }
}
