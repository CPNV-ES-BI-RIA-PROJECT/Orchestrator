import { registerAs } from '@nestjs/config';
import { WorkflowsConfig } from '../interfaces/workflow-config.interface';

export default registerAs(
  'workflows',
  (): WorkflowsConfig => ({
    etl: {
      steps: [
        {
          type: 'extract',
          target: process.env.EXTRACT_WORKFLOW_TARGET || '',
        },
        {
          type: 'transform',
          target: process.env.TRANSFORM_WORKFLOW_TARGET || '',
        },
        {
          type: 'load',
          target: process.env.LOAD_WORKFLOW_TARGET || '',
        },
      ],
    },
  }),
);
