# Orchestrator

## Description

The Orchestrator acts as the central control plane for an ETL (Extract, Transform, Load) project. Built using the NestJS framework, it handles the execution and coordination of complex data pipelines.

## Getting Started

### Prerequisites

To run this project, you will need the following tools:

* **Runtime**: [Node.js 24.12.0](https://nodejs.org/)
* **IDE used**: [WebStorm](https://www.jetbrains.com/webstorm/)
* **Package manager**: [pnpm 10.27.0](https://pnpm.io/)
* **Virtualization**: [Docker](https://www.docker.com/)

### Configuration

1. Clone the repository and navigate into the orchestrator directory.

```bash
git clone https://github.com/CPNV-ES-BI-RIA-PROJECT/Orchestrator.git
cd Orchestrator
```

2. Install dependencies using your package manager:
```bash
pnpm install
```

3. Copy the example environment variable file to establish your local configuration:
```bash
cp .env.example .env
```

4. Adjust the environment variables based on the transport protocol and services you want to use.

### Environment variables

The application relies on the following runtime configuration:

* `PORT`: HTTP port used by the Orchestrator API
* `CLIENT_PROTOCOL`: Communication protocol used for workflow steps (`http` or `mqtt`)
* `CLIENT_TIMEOUT`: Timeout in milliseconds used by external client calls
* `EXTRACT_WORKFLOW_TARGET`: Target endpoint or MQTT target for the extract step
* `TRANSFORM_WORKFLOW_TARGET`: Target endpoint or MQTT target for the transform step
* `LOAD_WORKFLOW_TARGET`: Target endpoint or MQTT target for the load step
* `CLIENT_MQTT_BROKER_URL`: MQTT broker URL used when `CLIENT_PROTOCOL=mqtt`
* `CLIENT_MQTT_NAMESPACE`: Namespace used to build MQTT command and event topics
* `CLIENT_MQTT_SCHEMA_VERSION`: Schema version expected in MQTT request and response payloads
* `CACHE_SERVICE_URL`: Base URL of the cache service
* `CACHE_NAMESPACE`: Namespace used when building cache keys and cache endpoints

## Deployment

### On dev environment

To start the application in development mode with hot-reloading:

```bash
pnpm start:dev
```

To run tests:

```bash
pnpm test          # Unit tests
pnpm test:e2e      # End-to-end tests
```

### On integration environment

For integration and production environments, you must first build the application, then run the compiled code from the `dist` directory:

```bash
pnpm build
pnpm start:prod
```

### Using docker

The repository includes a `Dockerfile` for containerized builds and deployment. At the moment, service orchestration is still expected to be handled externally since the orchestrator needs the other services to work correctly.

## API Documentation

This project uses Swagger documentation that you can find at `http://localhost:<PORT>/api/v1`.

## Protocol support

### HTTP mode

When `CLIENT_PROTOCOL=http`, each workflow step calls the configured HTTP target directly. **This setting is currently necessary** as not all external services have implemented the MQTT protocol.

### MQTT mode

When `CLIENT_PROTOCOL=mqtt`, the Orchestrator publishes commands to MQTT topics and waits for matching completion events from the broker.

## Architecture documentation

The `docs/` directory contains PlantUML diagrams describing the current design:

* `docs/HttpSequenceDiagram.puml`: Workflow execution over HTTP
* `docs/MqttSequenceDiagram.puml`: Workflow execution over MQTT
* `docs/ServiceClassDiagram.puml`: Main service relationships and responsibilities

## Directory structure

The project follows a modular structure optimized for NestJS applications:

```text
.
├── src/
│   ├── cache/                # Cache key generation and cache service integration
│   ├── client/               # External communication layer
│   │   ├── config/
│   │   ├── http/             # Implementation of the HTTP client service
│   │   ├── mqtt/             # MQTT command publishing and broker event handling
│   │   └── interfaces/
│   ├── workflow/             # Core orchestrator logic, REST endpoints, and state management
│   │   ├── config/           # Workflow-specific configuration definitions
│   │   ├── dto/
│   │   ├── filters/          # Custom exception filters for workflow error handling and retries
│   │   ├── interfaces/
│   │   ├── models/           # Context models tracking job progress
│   │   ├── pipes/            # Validation logic ensuring incoming workflow requests are well-formed
│   │   └── strategies/       # Implementations of workflow types (e.g., etl-workflow) and steps
│   └── main.ts
├── docs/                     # Sequence and class diagrams for the current architecture
├── test/                     # Jest testing suite
│   ├── cache/
│   ├── client/
│   └── workflow/
```

## Collaborate

* **Proposing features:** Please open an issue or submit a pull request.
* **Commits:** We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
* **Branching:** We follow [Conventional Branching](https://conventional-branch.github.io/) standards.

## License

MIT License
