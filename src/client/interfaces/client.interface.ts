export interface IClient {
  post<TPayload, TResult>(target: string, payload: TPayload): Promise<TResult>;

  postWithHeaders<T>(
    url: string,
    data: any,
    headers: Record<string, string>,
  ): Promise<T>;
}
