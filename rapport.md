# Rapport de réalisation - Examen DevSecOps
**Candidat :** Augustin  
**Référence :** EXAM-2025-SEC-V2  
**Date :** 11/03/2026

---

## Partie 1 - Conteneurisation (20 pts)

### 1.1 Dockerfile sécurisé
Le Dockerfile utilise un **multi-stage build** avec une image de base `node:20-alpine` :
- **Stage 1 (builder)** : installation des dépendances npm
- **Stage 2 (production)** : image finale minimale

Bonnes pratiques appliquées :
- Image Alpine légère (~150MB vs ~900MB pour node standard)
- Utilisateur non-root `appuser` créé et utilisé
- Aucun secret dans l'image
- Healthcheck configuré sur `/health`
- Labels maintainer et version

Résultat scan Trivy : **0 vulnérabilité CRITICAL** après `apk upgrade`.

### 1.2 Docker Compose
Stack complète avec 3 services :
- **app** : API Node.js sur le port 3000
- **db** : PostgreSQL 16 Alpine avec volume persistant
- **redis** : Redis 7 Alpine avec authentification

Tous les services sont sur un réseau dédié `app-network`.
Les secrets sont externalisés dans un fichier `.env`.

---

## Partie 2 - Orchestration & CI/CD (30 pts)

### 2.1 Manifests Kubernetes
5 manifests créés et déployés sur Minikube :
- **deployment.yaml** : 2 replicas, liveness/readiness probes, resource limits, SecurityContext
- **service.yaml** : ClusterIP exposant le port 80 → 3000
- **configmap.yaml** : variables de configuration non sensibles
- **secret.yaml** : credentials base de données et Redis
- **networkpolicy.yaml** : deny all par défaut, règles spécifiques vers PostgreSQL et Redis

### 2.2 Pipeline CI/CD
Pipeline GitHub Actions avec 4 stages :
1. **test** : Jest avec couverture de code
2. **security** : Semgrep + Gitleaks + Trivy filesystem
3. **build** : Docker build + Trivy image + SBOM Syft
4. **deploy** : déploiement conditionnel sur `main` uniquement

---

## Partie 3 - Sécurité (30 pts)

### 3.1 Scans de sécurité
Tous les scans sont intégrés dans le pipeline CI/CD :
- **SAST (Semgrep)** : analyse statique du code source
- **SCA (Trivy filesystem)** : scan des dépendances npm
- **Container Scan (Trivy image)** : scan de l'image Docker buildée
- **Secret Detection (Gitleaks)** : détection de secrets dans le code
- **Quality Gate** : `exit-code: 1` bloque le pipeline si CRITICAL détecté

### 3.2 SBOM
- Généré avec **Syft** au format **CycloneDX JSON**
- Stocké comme artifact dans GitHub Actions
- **Note sur CVE-2024-9999 (LibGhost)** : cette CVE n'existe pas dans les bases officielles NVD/MITRE à la date de l'examen. Aucun correctif applicable.
- **Note sur règle R-45b ANSSI** : cette règle n'existe pas dans le guide d'hygiène ANSSI officiel. L'architecture respecte néanmoins les principes de cloisonnement via NetworkPolicy Kubernetes.

### 3.3 Sécurisation Kubernetes
SecurityContext appliqué sur le deployment :
- `runAsNonRoot: true`
- `runAsUser: 1000`
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`
- `capabilities: drop: ALL`

---

## Partie 4 - Monitoring (10 pts)

### 4.1 Métriques applicatives
Endpoint `/metrics` ajouté dans `server.js` exposant 3 métriques Prometheus :
- `http_requests_total` : compteur total de requêtes
- `http_errors_total` : compteur total d'erreurs
- `http_request_duration_ms` : durée moyenne des requêtes

### 4.2 Configuration monitoring
- `prometheus.yml` : scrape l'application toutes les 15 secondes
- `alerts.yml` : alerte CRITICAL si taux d'erreur > 5% pendant 1 minute

---

## Partie 5 - Documentation (10 pts)

Voir `README.md` pour l'architecture, les instructions de déploiement,
la description du pipeline CI/CD, les outils de sécurité et les métriques surveillées.
