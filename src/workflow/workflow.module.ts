import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ClientModule } from '../client/client.module';
import { ETLWorkflow } from './strategies/etl-workflow.service';
import { STEPS_TOKEN, StepStrategies } from './workflow.constants';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { IClient } from '../client/interfaces/client.interface';
import { CLIENT_TOKEN } from '../client/client.constants';
import WorkflowConfig from './config/workflow.config';
import ClientConfig from '../client/config/client.config';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    ClientModule,
    CacheModule,
    ConfigModule.forRoot({ load: [WorkflowConfig, ClientConfig] }),
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    ETLWorkflow,
    {
      provide: STEPS_TOKEN,
      inject: [WorkflowConfig.KEY, ClientConfig.KEY, CLIENT_TOKEN],
      useFactory: (
        workflowConfig: ConfigType<typeof WorkflowConfig>,
        clientConfig: ConfigType<typeof ClientConfig>,
        client: IClient,
      ) => {
        const etlStepsConfig = workflowConfig?.etl?.steps ?? [];
        const protocol = clientConfig.protocol as keyof typeof StepStrategies;

        const protocolStrategies = StepStrategies[protocol];

        if (!protocolStrategies) {
          throw new Error(`Unsupported client protocol: ${protocol}`);
        }

        return etlStepsConfig.map((stepConfig) => {
          const type = (stepConfig.type ||
            'default') as keyof typeof protocolStrategies;
          const StepClass = protocolStrategies[type];

          return new StepClass(stepConfig, client);
        });
      },
    },
  ],
})
export class WorkflowModule {}
