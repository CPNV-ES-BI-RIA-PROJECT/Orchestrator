export class WorkflowContext<T = Express.Multer.File> {
  public readonly correlationId: string;
  public readonly payload: Readonly<T>;

  constructor(correlationId: string, payload: T) {
    this.correlationId = correlationId;
    this.payload = Object.freeze(payload);

    Object.freeze(this);
  }
}
