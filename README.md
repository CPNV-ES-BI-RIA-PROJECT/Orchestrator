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

Currently, the orchestrator is run natively or deployed via standard node commands. In the future, there will be a `docker-compose.yml` file provided that will stand up all necessary services simultaneously (including the Orchestrator and the standalone ETL containers).

## Directory structure

The project follows a modular structure optimized for NestJS applications:

```text
.
├── src/
│   ├── client/               # External communication layer
│   │   ├── config/
│   │   ├── http/             # Implementation of the HTTP client service
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
├── test/                     # Jest testing suite
│   ├── client/
│   └── workflow/
```

## Collaborate

* **Proposing features:** Please open an issue or submit a pull request.
* **Commits:** We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
* **Branching:** We follow [Conventional Branching](https://conventional-branch.github.io/) standards.

## License

UNLICENSED
