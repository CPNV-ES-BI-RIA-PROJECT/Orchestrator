export class WorkflowContext<T = Express.Multer.File> {
  public readonly jobId: string;
  public readonly payload: Readonly<T>;

  constructor(jobId: string, payload: T) {
    this.jobId = jobId;
    this.payload = Object.freeze(payload);

    Object.freeze(this);
  }
}
