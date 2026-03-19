# Sprint 1 presentation

## Introduction

- [Goal](https://github.com/CPNV-ES-BI-RIA-PROJECT/.github/blob/main/profile/sprint001.md)
- Sequence diagram

## Demonstration

### Generate share link for file

```bash
curl -s -X POST "http://localhost:8080/api/objects/share?remote=bi1-arthur/placeholder.ics&expirationTime=3600"
```

### Run orchestrator

- Start orchestrator in debug mode for step by step
- Trigger the orchestrator via swagger documentation