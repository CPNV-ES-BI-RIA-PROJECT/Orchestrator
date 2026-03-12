import { registerAs } from '@nestjs/config';
import { WorkflowsConfig } from '../interfaces/workflow-config.interface';

export default registerAs(
  'workflows',
  (): WorkflowsConfig => ({
    etl: {
      steps: [
        {
          type: 'extract',
          targetUrl: process.env.EXTRACT_WORKFLOW_TARGET || '',
        },
        {
          type: 'transform',
          targetUrl: process.env.TRANSFORM_WORKFLOW_TARGET || '',
        },
        {
          type: 'load',
          targetUrl: process.env.LOAD_WORKFLOW_TARGET || '',
        },
      ],
    },
  }),
);
