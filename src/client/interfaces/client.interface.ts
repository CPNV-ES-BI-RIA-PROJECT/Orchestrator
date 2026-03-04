export interface IClient {
  post<TPayload, TResult>(target: string, payload: TPayload): Promise<TResult>;
}
