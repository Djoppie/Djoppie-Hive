// ============================================================================
// Djoppie-Hive - DEV Environment Infrastructure
// ============================================================================
// Description: Ultra-low cost development environment for HR Admin system
// Default Region: West Europe
// Target Cost: EUR 6-10/month
// ============================================================================

targetScope = 'subscription'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev)')
param environment string = 'dev'

@description('Primary Azure region for resources')
param location string = 'westeurope'

@description('Project name prefix for all resources')
param projectName string = 'djoppie-hive'

@description('Unique suffix for globally unique resource names (6 characters)')
@minLength(6)
@maxLength(6)
param uniqueSuffix string = substring(uniqueString(subscription().subscriptionId, projectName, environment), 0, 6)

@description('SQL Administrator username')
@secure()
param sqlAdminUsername string

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('Microsoft Entra Tenant ID (Diepenbeek)')
@secure()
param entraTenantId string

@description('Backend API App Registration Client ID')
@secure()
param entraBackendClientId string

@description('Backend API App Registration Client Secret')
@secure()
param entraBackendClientSecret string

@description('Frontend SPA App Registration Client ID')
@secure()
param entraFrontendClientId string

@description('Email addresses for alert notifications')
param alertEmailAddresses array = []

@description('Enable monitoring alerts')
param enableAlerts bool = true

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Project: projectName
  ManagedBy: 'Bicep'
  CostCenter: 'IT-Infrastructure'
  Department: 'Diepenbeek-HR'
  Application: 'HRadmin'
}

// ============================================================================
// VARIABLES
// ============================================================================

var resourceGroupName = 'rg-${projectName}'
var namingPrefix = '${projectName}-${environment}'

// ============================================================================
// RESOURCE GROUP
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// MODULES
// ============================================================================

// Key Vault - Must be deployed first for secrets
module keyVault 'modules/keyvault.bicep' = {
  scope: resourceGroup
  name: 'keyVaultDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    entraTenantId: entraTenantId
  }
}

// Log Analytics Workspace
module logAnalytics 'modules/loganalytics.bicep' = {
  scope: resourceGroup
  name: 'logAnalyticsDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
  }
}

// Application Insights
module appInsights 'modules/appinsights.bicep' = {
  scope: resourceGroup
  name: 'appInsightsDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// SQL Server and Database (Serverless)
module sqlServer 'modules/sqlserver.dev.bicep' = {
  scope: resourceGroup
  name: 'sqlServerDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    sqlAdminUsername: sqlAdminUsername
    sqlAdminPassword: sqlAdminPassword
    entraTenantId: entraTenantId
  }
}

// App Service Plan (F1 Free)
module appServicePlan 'modules/appserviceplan.dev.bicep' = {
  scope: resourceGroup
  name: 'appServicePlanDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
  }
}

// App Service (Backend API)
module appService 'modules/appservice.dev.bicep' = {
  scope: resourceGroup
  name: 'appServiceDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    uniqueSuffix: uniqueSuffix
    tags: tags
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    sqlServerFqdn: sqlServer.outputs.sqlServerFqdn
    sqlDatabaseName: sqlServer.outputs.databaseName
    frontendUrl: 'http://localhost:5173' // Will be updated after Static Web App deployment
    entraBackendClientId: entraBackendClientId
  }
}

// Grant App Service access to Key Vault using RBAC
module keyVaultRbac 'modules/keyvault-rbac.bicep' = {
  scope: resourceGroup
  name: 'keyVaultRbacDeployment'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    appServicePrincipalId: appService.outputs.appServicePrincipalId
  }
  dependsOn: [
    appService
    keyVault
  ]
}

// Store secrets in Key Vault
module secrets 'modules/keyvault-secrets.bicep' = {
  scope: resourceGroup
  name: 'keyVaultSecretsDeployment'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    sqlConnectionString: 'Server=tcp:${sqlServer.outputs.sqlServerFqdn},1433;Initial Catalog=${sqlServer.outputs.databaseName};Persist Security Info=False;User ID=${sqlAdminUsername};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    entraTenantId: entraTenantId
    entraBackendClientId: entraBackendClientId
    entraBackendClientSecret: entraBackendClientSecret
    entraFrontendClientId: entraFrontendClientId
    appInsightsConnectionString: appInsights.outputs.connectionString
  }
  dependsOn: [
    keyVault
    sqlServer
    appInsights
  ]
}

// Static Web App (Frontend SPA)
module staticWebApp 'modules/staticwebapp.bicep' = {
  scope: resourceGroup
  name: 'staticWebAppDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
    skuName: 'Free'
    backendApiUrl: appService.outputs.appServiceUrl
  }
}

// Monitoring Alerts (Task 6.5)
module monitoringAlerts 'modules/monitoring-alerts.bicep' = {
  scope: resourceGroup
  name: 'monitoringAlertsDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
    appInsightsId: appInsights.outputs.appInsightsId
    appServiceId: appService.outputs.appServiceId
    alertEmailAddresses: alertEmailAddresses
    enableAlerts: enableAlerts
  }
  dependsOn: [
    appInsights
    appService
  ]
}

// Monitoring Dashboard (Task 6.5)
module monitoringDashboard 'modules/monitoring-dashboard.bicep' = {
  scope: resourceGroup
  name: 'monitoringDashboardDeployment'
  params: {
    location: location
    environment: environment
    namingPrefix: namingPrefix
    tags: tags
    appInsightsId: appInsights.outputs.appInsightsId
    appInsightsName: appInsights.outputs.appInsightsName
    appServiceId: appService.outputs.appServiceId
    appServiceName: appService.outputs.appServiceName
    resourceGroupName: resourceGroupName
  }
  dependsOn: [
    appInsights
    appService
  ]
}

// ============================================================================
// OUTPUTS
// ============================================================================

output resourceGroupName string = resourceGroup.name
output location string = location
output environment string = environment

// Key Vault
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri

// SQL Server
output sqlServerName string = sqlServer.outputs.sqlServerName
output sqlServerFqdn string = sqlServer.outputs.sqlServerFqdn
output sqlDatabaseName string = sqlServer.outputs.databaseName

// App Service
output appServiceName string = appService.outputs.appServiceName
output appServiceUrl string = appService.outputs.appServiceUrl
output appServicePrincipalId string = appService.outputs.appServicePrincipalId

// Application Insights
output appInsightsName string = appInsights.outputs.appInsightsName
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
output appInsightsConnectionString string = appInsights.outputs.connectionString

// Static Web App
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output staticWebAppUrl string = staticWebApp.outputs.staticWebAppUrl
output staticWebAppApiKey string = staticWebApp.outputs.staticWebAppApiKey

// Log Analytics
output logAnalyticsWorkspaceId string = logAnalytics.outputs.workspaceId
output logAnalyticsWorkspaceName string = logAnalytics.outputs.workspaceName

// Monitoring
output monitoringDashboardId string = monitoringDashboard.outputs.dashboardId
output monitoringDashboardName string = monitoringDashboard.outputs.dashboardName

// Deployment Information
output estimatedMonthlyCost string = 'EUR 6-10'
