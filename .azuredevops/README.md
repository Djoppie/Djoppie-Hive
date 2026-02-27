# Djoppie-Hive Azure DevOps CI/CD Pipeline Setup Guide

## Overview

This guide walks you through setting up Azure DevOps CI/CD pipelines for the Djoppie-Hive HR application. The pipelines are designed for:

- **CI Pipeline** (`ci.yml`): Builds, tests, and validates frontend/backend code
- **CD Pipeline** (`deploy.yml`): Deploys infrastructure, runs migrations, and deploys applications

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure DevOps Project Setup](#azure-devops-project-setup)
3. [Service Connection Configuration](#service-connection-configuration)
4. [Variable Groups Setup](#variable-groups-setup)
5. [Pipeline Creation](#pipeline-creation)
6. [Secrets Management](#secrets-management)
7. [Running Pipelines](#running-pipelines)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Prerequisites

Before starting, ensure you have:

### 1. **Azure Resources Created**

```
Resource Group: rg-djoppie-hive (West Europe)
- App Service Plan: plan-djoppie-hive-dev
- App Service: app-djoppie-hive-dev-api
- Static Web App: swa-djoppie-hive-dev-ui
- SQL Database: sql-djoppie-hive-dev (serverless)
- Key Vault: kv-djoppie-hive-dev
- Application Insights: appi-djoppie-hive-dev
- Log Analytics: log-djoppie-hive-dev
```

**Bicep templates** should be available at `infra/bicep/main.dev.bicep`

### 2. **GitHub Repository Access**

- Repository: GitHub (not Azure Repos)
- Personal Access Token or GitHub credentials for Azure DevOps integration

### 3. **Azure Subscription Details**

- Subscription ID: `<your-subscription-id>`
- Tenant ID: `7db28d6f-d542-40c1-b529-5e5ed2aad545`
- Azure Entra Application IDs (from app registrations):
  - Frontend: `acc348be-b533-4402-8041-672c1cba1273`
  - Backend: `2b620e06-39ee-4177-a559-76a12a79320f`

### 4. **Local Development Environment**

- Azure CLI: `az --version` ≥ 2.50
- .NET SDK: `dotnet --version` = 8.0
- Node.js: `node --version` = 20.x
- Git: Latest version

### 5. **Azure DevOps Organization**

- Create if not already done at <https://dev.azure.com>
- Project name: Djoppie-Hive (or your preferred name)

---

## Azure DevOps Project Setup

### Step 1: Create Azure DevOps Project

1. Go to **<https://dev.azure.com>**
2. Click **Create project**
3. Enter:
   - **Project name**: `Djoppie-Hive`
   - **Visibility**: Private (for HR data security)
   - **Version control**: Git
4. Click **Create**

### Step 2: Import Repository (Optional)

If using GitHub:

1. In your Azure DevOps project, go to **Repos** → **Repositories**
2. Click **Import** (if not already connected)
3. Enter GitHub repository URL
4. Authenticate with GitHub credentials

---

## Service Connection Configuration

### Step 1: Create Service Connection in Azure DevOps

The pipeline requires authentication to Azure resources. Create a **Service Connection**:

1. Go to **Project Settings** → **Service connections**
2. Click **New service connection** → **Azure Resource Manager**
3. Select **Service principal (automatic)**
4. Fill in:
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: `rg-djoppie-hive`
   - **Service connection name**: `AzureResourceManager-Djoppie`
5. Click **Save**

> **Note**: Azure DevOps will automatically create a service principal in your Azure Entra ID with necessary permissions.

### Step 2: Verify Service Principal Permissions

The service principal needs the following roles:

- **Contributor** on the subscription (for resource deployment)
- **Key Vault Administrator** (for accessing secrets)
- **SQL Server Contributor** (for running migrations)

To verify/add roles:

```bash
# Get service principal ID
az ad sp list --display-name "Djoppie-Hive" --query "[0].id" -o tsv

# Assign roles
SUBSCRIPTION_ID="<your-subscription-id>"
SP_ID="<service-principal-id>"

# Add Contributor role
az role assignment create \
  --assignee-object-id $SP_ID \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

# Add Key Vault Administrator role
az role assignment create \
  --assignee-object-id $SP_ID \
  --role "Key Vault Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-djoppie-hive"
```

---

## Variable Groups Setup

Variable groups centralize configuration and secrets for pipelines. Create them in Azure DevOps:

### Step 1: Create Variable Group for Dev Environment

1. Go to **Pipelines** → **Library** → **Variable groups**
2. Click **+ Variable group**
3. Enter **Name**: `Djoppie-Hive-Dev`
4. Add the following variables:

#### **Non-Secret Variables**

| Variable Name | Value | Example |
|--------------|-------|---------|
| `AZURE_SUBSCRIPTION_ID` | Your subscription ID | `12345678-1234-1234-1234-123456789012` |
| `AZURE_RESOURCE_GROUP` | Resource group name | `rg-djoppie-hive` |
| `AZURE_TENANT_ID` | Tenant ID | `7db28d6f-d542-40c1-b529-5e5ed2aad545` |
| `ENTRA_TENANT_ID` | Azure Entra Tenant ID | `7db28d6f-d542-40c1-b529-5e5ed2aad545` |
| `ENTRA_FRONTEND_CLIENT_ID` | Frontend app ID | `acc348be-b533-4402-8041-672c1cba1273` |
| `ENTRA_BACKEND_CLIENT_ID` | Backend app ID | `2b620e06-39ee-4177-a559-76a12a79320f` |
| `VITE_ENTRA_CLIENT_ID` | Frontend Entra client ID | `acc348be-b533-4402-8041-672c1cba1273` |
| `VITE_ENTRA_AUTHORITY` | Entra authority URL | `https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545` |
| `VITE_API_BASE_URL_DEV` | Backend API URL (dev) | `https://app-djoppie-hive-dev-api.azurewebsites.net` |
| `SQL_ADMIN_USERNAME` | SQL admin username | `sqladmin` |

#### **Secret Variables** (Click 🔒 to lock)

| Variable Name | Value | Source |
|--------------|-------|--------|
| `ENTRA_BACKEND_CLIENT_SECRET` | Backend app secret | Azure Entra → App registration → Certificates & secrets |
| `SQL_ADMIN_PASSWORD` | SQL admin password | Generate 16+ chars with special chars |
| `SQL_CONNECTION_STRING` | SQL connection string | `Server=tcp:sql-djoppie-hive-dev.database.windows.net...` |

> **Security Note**: These secrets will be stored encrypted in Azure DevOps and accessible only to authorized users. Never commit them to git.

### Step 2: Grant Pipeline Access

After creating the variable group:

1. Click the **⋮** menu → **Security**
2. Add pipelines that can access this variable group:
   - `CI - Djoppie-Hive`
   - `CD - Djoppie-Hive`

---

## Pipeline Creation

### Step 1: Create CI Pipeline

1. Go to **Pipelines** → **Pipelines** → **Create Pipeline**
2. Select **GitHub** (or Azure Repos if you imported)
3. Select repository: `Djoppie-Hive`
4. Choose **Existing Azure Pipelines YAML file**
5. Select branch: `main`
6. Path: `.azuredevops/ci.yml`
7. Click **Continue**
8. Click **Save and run**

**Name the pipeline**: `CI - Djoppie-Hive`

### Step 2: Create CD Pipeline

1. Go to **Pipelines** → **Pipelines** → **Create Pipeline**
2. Repeat steps 2-5 above
3. **Path**: `.azuredevops/deploy.yml`
4. Click **Continue**
5. In the YAML editor, modify the trigger to use build artifacts from CI:

   ```yaml
   # In deploy.yml, update the artifact pipeline name to match your CI pipeline:
   pipeline: 'CI - Djoppie-Hive'  # Must match the CI pipeline name exactly
   ```

6. Click **Save and run**

**Name the pipeline**: `CD - Djoppie-Hive`

### Step 3: Configure Pipeline Triggers

**For CI Pipeline**:

- Triggers on PR and push to `main`
- Already configured in `ci.yml`

**For CD Pipeline**:

- Triggered manually or by completion of CI pipeline
- To enable automatic trigger after CI success:
  1. Open CD pipeline
  2. Click **Edit** → **⋮** → **Triggers**
  3. Enable **Build completion**
  4. Select CI pipeline: `CI - Djoppie-Hive`
  5. Select branch: `main`

---

## Secrets Management

### Strategy 1: Azure Key Vault (Recommended)

All production secrets should be stored in Azure Key Vault:

1. **Create secrets in Key Vault**:

   ```bash
   az keyvault secret set \
     --vault-name kv-djoppie-hive-dev \
     --name "sql-connection-string" \
     --value "Server=tcp:sql-djoppie-hive-dev.database.windows.net,1433;Initial Catalog=djoppie-hive-db;Persist Security Info=False;User ID=sqladmin;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
   
   az keyvault secret set \
     --vault-name kv-djoppie-hive-dev \
     --name "entra-backend-client-secret" \
     --value "<backend-app-secret>"
   ```

2. **Reference in App Service**:
   - Connection strings and app settings can reference Key Vault:

     ```
     @Microsoft.KeyVault(SecretUri=https://kv-djoppie-hive-dev.vault.azure.net/secrets/sql-connection-string/version)
     ```

3. **In Pipeline**:
   - Pipelines retrieve secrets from Key Vault using service connection
   - Example (in CD pipeline):

     ```yaml
     - task: AzureCLI@2
       inputs:
         azureSubscription: $(serviceConnectionName)
         scriptType: 'bash'
         inlineScript: |
           az keyvault secret show \
             --vault-name $(keyVaultName) \
             --name "sql-connection-string" \
             --query value -o tsv
     ```

### Strategy 2: Azure DevOps Variable Groups (For Non-Sensitive)

For development-only configurations:

- Stored encrypted in Azure DevOps
- Accessible to authorized team members
- Cannot access Key Vault with these secrets

---

## Running Pipelines

### Manual Trigger

1. Go to **Pipelines** → **Pipelines**
2. Select pipeline: `CI - Djoppie-Hive` or `CD - Djoppie-Hive`
3. Click **Run pipeline**
4. Select branch (default: `main`)
5. Click **Run**

### Automatic Triggers

**CI Pipeline** (Automatic):

- Triggers on Pull Requests to `main`
- Triggers on push to `main` branch
- You can watch progress in real-time

**CD Pipeline** (Manual → Automatic):

1. After CI completes successfully, click **CD - Djoppie-Hive**
2. Click **Run pipeline**
3. Pipeline automatically downloads CI artifacts and deploys

### View Pipeline Runs

1. Go to **Pipelines** → **Pipelines**
2. Click on desired pipeline
3. View build history, logs, and artifacts

---

## Troubleshooting

### Issue: "Unable to download artifact"

**Cause**: CD pipeline can't find CI pipeline output

**Solution**:

1. Verify CI pipeline name matches exactly in `deploy.yml`
2. Ensure CI pipeline has completed successfully
3. Check artifact names match between pipelines

```yaml
# In deploy.yml, verify this matches your CI pipeline:
pipeline: 'CI - Djoppie-Hive'  # MUST match exactly
```

---

### Issue: "Service connection authentication failed"

**Cause**: Service principal lacks permissions

**Solution**:

```bash
# Re-run permission assignment
SUBSCRIPTION_ID="<your-subscription-id>"
SP_ID=$(az ad sp list --display-name "Djoppie-Hive" --query "[0].id" -o tsv)

# Add missing roles
az role assignment create \
  --assignee-object-id $SP_ID \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

az role assignment create \
  --assignee-object-id $SP_ID \
  --role "Key Vault Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-djoppie-hive"
```

---

### Issue: "Bicep deployment failed"

**Cause**: Infrastructure template errors or Azure resource conflicts

**Solution**:

1. Validate Bicep locally:

   ```bash
   az bicep build --file infra/bicep/main.dev.bicep
   ```

2. Check resource group permissions
3. Verify all parameters are correct in `parameters-dev.json`
4. Check pipeline logs for detailed error messages

---

### Issue: "Database migration timeout"

**Cause**: Large database or slow connection

**Solution**:

1. Increase timeout in pipeline:

   ```yaml
   - task: DotNetCoreCLI@2
     timeoutInMinutes: 10
     displayName: 'Run Migrations'
   ```

2. Verify SQL connection string is correct
3. Check SQL firewall allows Azure services

---

### Issue: "Frontend build fails with environment variables"

**Cause**: Vite environment variables not set correctly

**Solution**:

1. Verify variable group has all required VITE_* variables
2. Check variable names match exactly (case-sensitive)
3. Ensure pipeline job links the variable group:

   ```yaml
   variables:
     - group: 'Djoppie-Hive-Dev'
   ```

---

### Issue: "Static Web App deployment fails"

**Cause**: Incorrect deployment token or SWA CLI issues

**Solution**:

1. Regenerate deployment token in Azure:

   ```bash
   az staticwebapp secrets reset \
     --name swa-djoppie-hive-dev-ui \
     --resource-group rg-djoppie-hive
   ```

2. Update variable group with new token
3. Verify app location path is correct

---

## Best Practices

### 1. **Security**

✅ **DO**:

- Store all secrets in Azure Key Vault
- Use service principal (not personal credentials)
- Enable Key Vault access policies via RBAC
- Rotate secrets regularly
- Mark variable group secrets with 🔒 lock icon

❌ **DON'T**:

- Commit secrets to git
- Use personal access tokens in variable groups
- Share connection string in logs
- Use wildcard RBAC assignments

---

### 2. **Code Quality**

✅ **DO**:

- Run linter on all commits
- Run unit tests before deployment
- Include integration tests
- Publish test results for tracking
- Fail pipeline on test failure

❌ **DON'T**:

- Skip tests for speed
- Allow lint warnings to pass
- Deploy untested code

---

### 3. **Deployment Strategy**

✅ **DO**:

- Use separate pipelines for CI and CD
- Run post-deployment health checks
- Implement gradual rollout (staging first)
- Keep deployment logs for audit trail
- Have rollback procedure

❌ **DON'T**:

- Deploy directly from developer machines
- Skip infrastructure validation
- Combine build and deploy in one pipeline (for production)
- Delete old deployment artifacts immediately

---

### 4. **Monitoring & Alerting**

Set up monitoring for production:

```bash
# Enable Application Insights monitoring
az webapp config appsettings set \
  --name app-djoppie-hive-dev-api \
  --resource-group rg-djoppie-hive \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<key>

# Configure alerts in Azure Portal for:
# - High CPU usage
# - Failed requests
# - Long response times
# - Database connection issues
```

---

### 5. **Documentation**

✅ **DO**:

- Document any manual steps
- Keep runbook for common issues
- Document environment-specific configs
- Update README with deployment instructions

❌ **DON'T**:

- Leave pipelines undocumented
- Create tribal knowledge

---

## Pipeline Performance Optimization

### Parallel Stages

The pipelines run some stages in parallel:

- Frontend and Backend build simultaneously
- Health checks after deployment

### Caching

To improve build performance:

**Frontend**:

```yaml
- task: Npm@1
  inputs:
    command: 'ci'
    workingDir: 'hr-personeel'
    # npm ci uses lockfile - cache automatically
```

**Backend**:

```yaml
- task: DotNetCoreCLI@2
  inputs:
    command: 'restore'
    # Azure DevOps caches NuGet packages automatically
```

---

## Advanced Configuration

### Scheduled Deployments

Deploy on a schedule (e.g., nightly builds):

```yaml
# Add to deploy.yml
schedules:
  - cron: "0 2 * * *"  # 2 AM daily
    displayName: 'Nightly deployment'
    branches:
      include:
        - main
```

---

### Multiple Environments

Create separate variable groups for each environment:

- `Djoppie-Hive-Dev`
- `Djoppie-Hive-Staging`
- `Djoppie-Hive-Prod`

Clone `deploy.yml` to `deploy-staging.yml` and `deploy-prod.yml`, updating variable group references.

---

### Approvals & Gates

For production deployments, add approval gates:

1. Edit CD pipeline
2. Go to **⋮** → **Approvals and checks**
3. Add **Approvals** for deployment stages
4. Select users who must approve

---

## Support & Maintenance

### Regular Tasks

- **Monthly**: Review pipeline execution logs
- **Quarterly**: Update dependencies (.NET, Node.js, npm packages)
- **Quarterly**: Review and rotate secrets in Key Vault
- **Annually**: Audit pipeline permissions and service principal roles

### Getting Help

- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [GitHub Issues](https://github.com/your-org/djoppie-hive/issues)

---

## Summary

Your Djoppie-Hive CI/CD pipelines are now configured! 🎉

**Quick Checklist**:

- ✅ Service connection created: `AzureResourceManager-Djoppie`
- ✅ Variable group created: `Djoppie-Hive-Dev`
- ✅ Secrets stored in Azure Key Vault
- ✅ CI pipeline created: `CI - Djoppie-Hive`
- ✅ CD pipeline created: `CD - Djoppie-Hive`
- ✅ Triggers configured
- ✅ Service principal permissions verified
- ✅ Health checks working

**Next Steps**:

1. Create a test PR to trigger CI pipeline
2. Review build and test results
3. Manually trigger CD pipeline to deploy
4. Verify frontend and backend are accessible
5. Test core HR features in deployed environment
