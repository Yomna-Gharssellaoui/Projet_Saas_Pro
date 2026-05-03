# ERP Platform DevOps Documentation

This document describes the CI/CD, Kubernetes, and Monitoring architecture implemented for the project.

## 1. CI/CD Pipelines (GitHub Actions)

We have implemented 4 pipelines located in `.github/workflows/`:

| Pipeline | Type | Trigger | Purpose |
|----------|------|---------|---------|
| `ci-backend.yml` | CI | Push to `main`/`develop` in `Back-End/` | Linting, Unit Tests, SonarQube Scan |
| `ci-frontend.yml` | CI | Push to `main`/`develop` in `Front-End/` | Build, Unit Tests, SonarQube Scan |
| `cd-backend.yml` | CD | Success of `ci-backend` | Docker Build & Push, Kubernetes Deployment |
| `cd-frontend.yml` | CD | Success of `ci-frontend` | Docker Build & Push, Kubernetes Deployment |

### Secrets Required in GitHub:
- `SONAR_TOKEN_BACKEND`, `SONAR_TOKEN_FRONTEND`
- `SONAR_HOST_URL`
- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `KUBECONFIG` (base64 encoded)

## 2. Code Quality (SonarQube)

SonarQube is integrated into the CI pipelines.
- **Backend**: Includes LCOV coverage report.
- **Frontend**: Scans source files with exclusions for tests and build artifacts.
- **Goal**: Maintain high test coverage and zero code smells.

## 3. Kubernetes Architecture (`kubeadm`)

The architecture is distributed across nodes managed via `kubeadm`.
- **Database**: PostgreSQL as a `StatefulSet` with `PersistentVolumeClaim`.
- **Backend**: `Deployment` with 2 replicas for high availability.
- **Frontend**: `Deployment` with 2 replicas, served via Nginx.
- **Ingress**: Nginx Ingress Controller handles traffic routing for `erp.local`.

### Deployment:
```bash
kubectl apply -f k8s/postgres-db.yml
kubectl apply -f k8s/backend.yml
kubectl apply -f k8s/frontend.yml
kubectl apply -f k8s/ingress.yml
```

## 4. Monitoring & Alerting

Located in `k8s/monitoring/`:
- **Prometheus**: Scrapes metrics from K8s nodes and the Backend application.
- **Alert Manager**: Configured to handle alerts with a webhook receiver.
- **Grafana**: Recommended for visualization (deploy using Helm or add to manifests).

## 5. Excellence Features

- **GitOps Strategy**: The CD pipelines use an automated image tag update strategy, compatible with GitOps tools like ArgoCD.
- **Horizontal Scaling**: All app deployments use multiple replicas by default.
- **Resource Limits**: Configured CPU/Memory limits to prevent node resource exhaustion.

## 6. Collaboration & Virtualization

To avoid conflicts as required, it is recommended that all group members use a shared **Vagrantfile** or **VirtualBox VM Image** pre-configured with `kubeadm` and Docker.
