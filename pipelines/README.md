# Azure DevOps Pipelines - Djoppie-Paparazzi

This directory contains the CI/CD pipeline configurations for the Djoppie-Paparazzi HR Admin application.

## Pipeline Overview

| Pipeline | File | Purpose |
|----------|------|---------|
| CI-Backend | `ci-backend.yml` | Build and test ASP.NET Core API |
| CI-Frontend | `ci-frontend.yml` | Build and lint React frontend |
| CD-Deploy | `cd-deploy.yml` | Deploy to Azure (DEV environment) |

## Setup Instructions

### 1. Create Service Connection

1. Go to Azure DevOps > Project Settings > Service connections
2. Create new "Azure Resource Manager" connection
3. Name it: `Azure-Djoppie-Paparazzi`
4. Select subscription and authorize

### 2. Create Variable Group

1. Go to Pipelines > Library
2. Create new variable group: `djoppie-paparazzi-dev`
3. Add the following variables:

| Variable | Type | Description |
|----------|------|-------------|
| `VITE_ENTRA_CLIENT_ID` | Plain | Frontend Entra App ID |
| `VITE_ENTRA_TENANT_ID` | Plain | Entra Tenant ID |
| `VITE_ENTRA_BACKEND_CLIENT_ID` | Plain | Backend API App ID |
| `VITE_API_URL` | Plain | Backend API URL |
| `STATIC_WEB_APP_DEPLOYMENT_TOKEN` | Secret | SWA deployment token |

**Variable Values for DEV:**
```
VITE_ENTRA_CLIENT_ID = acc348be-b533-4402-8041-672c1cba1273
VITE_ENTRA_TENANT_ID = 7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_BACKEND_CLIENT_ID = 2b620e06-39ee-4177-a559-76a12a79320f
VITE_API_URL = https://app-djoppie-paparazzi-dev.azurewebsites.net/api
```

### 3. Create Environments

1. Go to Pipelines > Environments
2. Create environment: `djoppie-paparazzi-dev`
3. (Optional) Add approval checks for production deployments

### 4. Create Pipelines

1. Go to Pipelines > New Pipeline
2. Select "Azure Repos Git" or "GitHub"
3. Select repository
4. Choose "Existing Azure Pipelines YAML file"
5. Select pipeline file from `/pipelines/` directory
6. Repeat for each pipeline

### 5. Pipeline Naming Convention

When creating pipelines, use these names:
- `CI-Backend` (for ci-backend.yml)
- `CI-Frontend` (for ci-frontend.yml)
- `CD-Deploy` (for cd-deploy.yml)

## Deployment Flow

```
┌─────────────────┐     ┌─────────────────┐
│   Push to Git   │────▶│   CI Pipelines  │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐            ┌──────▼─────┐
              │ CI-Backend │            │ CI-Frontend│
              └─────┬─────┘            └──────┬─────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                         ┌───────▼───────┐
                         │   CD-Deploy   │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐            ┌──────▼─────┐
              │ App Service│            │Static Web  │
              │   (API)    │            │   App      │
              └───────────┘            └────────────┘
```

## Templates

Reusable templates are located in `/pipelines/templates/`:

| Template | Purpose |
|----------|---------|
| `dotnet-build.yml` | .NET build, test, and restore steps |
| `node-build.yml` | Node.js/React build and lint steps |
| `azure-deploy.yml` | Azure App Service deployment steps |

### Using Templates

```yaml
steps:
  - template: templates/dotnet-build.yml
    parameters:
      projectPath: 'src/backend/DjoppiePaparazzi.slnx'
      buildConfiguration: 'Release'
      runTests: true
```

## Security Notes

- All secrets are stored in Azure Key Vault
- App Service uses Key Vault references for configuration
- Service Principal requires minimal permissions
- Branch policies enforce PR reviews before merge to main

## Troubleshooting

### Common Issues

1. **Build fails with "unauthorized"**
   - Check service connection permissions
   - Verify variable group is linked to pipeline

2. **Deployment fails with "resource not found"**
   - Run infrastructure deployment first
   - Check resource names match Bicep outputs

3. **Static Web App deployment fails**
   - Verify deployment token is correct
   - Check token hasn't expired

## Contact

For issues with pipelines, contact the DevOps team or create an issue in the repository.
