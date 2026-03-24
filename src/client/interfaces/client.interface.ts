export interface IClient {
  dispatch<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult>;
}
