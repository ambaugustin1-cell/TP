# TaskAPI - Projet DevSecOps

## Architecture de la solution
```
┌─────────────────────────────────────────┐
│            GitHub Actions CI/CD          │
│  test → security → build → deploy        │
└─────────────────────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │      Docker Image      │
        │      taskapi:v1        │
        └───────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│            Kubernetes (Minikube)         │
│  ┌──────────┐  ┌──────────┐             │
│  │  Pod 1   │  │  Pod 2   │  (2 replicas)│
│  └──────────┘  └──────────┘             │
│         Service ClusterIP               │
│         NetworkPolicy                   │
└─────────────────────────────────────────┘
        │               │
┌───────▼──────┐ ┌──────▼──────┐
│  PostgreSQL  │ │    Redis     │
└──────────────┘ └─────────────┘
```

## Instructions de déploiement local

### Prérequis
- Docker & Docker Compose
- kubectl & Minikube
- Git

### Déploiement avec Docker Compose
```bash
git clone https://github.com/ambaugustin1-cell/TP.git
cd TP
docker-compose up -d
curl http://localhost:3000/health
```

### Déploiement sur Kubernetes
```bash
minikube start --driver=docker
minikube image load taskapi:v1
kubectl apply -f k8s/
kubectl get pods
kubectl port-forward service/taskapi-service 8080:80
curl http://localhost:8080/health
```

## Pipeline CI/CD

Le pipeline GitHub Actions comporte 4 stages :

1. **Test** : Tests unitaires avec Jest + rapport de couverture
2. **Security** : SAST (Semgrep) + Secret Detection (Gitleaks) + SCA (Trivy)
3. **Build** : Build image Docker + scan Trivy + génération SBOM CycloneDX
4. **Deploy** : Déploiement conditionnel sur la branche main uniquement

## Outils de sécurité utilisés

| Outil | Type | Usage |
|-------|------|-------|
| Semgrep | SAST | Scan du code source |
| Trivy | SCA + Container Scan | Scan dépendances et image Docker |
| Gitleaks | Secret Detection | Détection de secrets dans le code |
| Syft | SBOM | Génération du Software Bill of Materials |

## Métriques surveillées

| Métrique | Type | Description |
|----------|------|-------------|
| http_requests_total | Counter | Nombre total de requêtes HTTP |
| http_errors_total | Counter | Nombre total d'erreurs HTTP |
| http_request_duration_ms | Gauge | Durée moyenne des requêtes en ms |

Prometheus scrape l'application toutes les 15 secondes sur `/metrics`.
Une alerte se déclenche si le taux d'erreur dépasse 5%.
