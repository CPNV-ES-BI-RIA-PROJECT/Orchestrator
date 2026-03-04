export class WorkflowContext<T = Express.Multer.File> {
    public readonly correlationId: string;
    public readonly payload: Readonly<T>;
    public readonly metadata: Readonly<Record<string, unknown>>;

    constructor(
        correlationId: string,
        payload: T,
        metadata: Record<string, unknown> = {},
    ) {
        this.correlationId = correlationId;
        this.payload = Object.freeze(payload);
        this.metadata = Object.freeze({ ...metadata });

        Object.freeze(this);
    }
}