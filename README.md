# World Countries API

A Node.js REST API to fetch world country details, with a full Jenkins + Gitea CI/CD pipeline.

## Tech Stack
- Node.js + Express
- MongoDB (Mongoose)
- Mocha + Chai (testing)
- Docker
- Jenkins Pipeline (CI/CD)
- AWS EC2, Lambda, S3
- ArgoCD + Kubernetes

## Run Locally
```bash
npm install
MONGO_URI=<uri> MONGO_USERNAME=<user> MONGO_PASSWORD=<pass> npm start
```

## Run Tests
```bash
npm test
```

## Run Coverage
```bash
npm run coverage
```

## Endpoints
| Method | Path       | Description              |
|--------|------------|--------------------------|
| POST   | /country   | Fetch country by ID      |
| GET    | /os        | OS and env info          |
| GET    | /live      | Liveness probe           |
| GET    | /ready     | Readiness probe          |
| GET    | /api-docs  | OpenAPI specification    |
# world-countries-app
