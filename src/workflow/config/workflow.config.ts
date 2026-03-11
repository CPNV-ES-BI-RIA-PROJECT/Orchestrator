import { registerAs } from '@nestjs/config';
import { WorkflowConfig } from '../interfaces/workflow-config.interface';

export default registerAs(
  'workflow',
  (): WorkflowConfig => ({
    steps: [
      {
        type: 'extract',
        targetUrl: process.env.EXTRACT_WORKFLOW_URL || '',
      },
    ],
  }),
);
