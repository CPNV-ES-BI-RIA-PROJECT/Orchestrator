import hash from 'object-hash';
import { Injectable } from '@nestjs/common';

export interface CacheBusinessRequest {
  urlJson: Record<string, string>;
  paramsJson?: Record<string, unknown>;
}

@Injectable()
export class CacheKeyService {
  buildCacheKey(request: CacheBusinessRequest): string {
    return hash(request);
  }
}
