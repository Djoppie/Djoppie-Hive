// ============================================================================
// Log Analytics Workspace Module - Djoppie-Hive
// ============================================================================
// Description: Deploys Log Analytics Workspace for monitoring
// Tier: PerGB2018 (Free tier: 5GB/month)
// Cost: Free within 5GB limit
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('Retention in days')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

// ============================================================================
// VARIABLES
// ============================================================================

var workspaceName = 'log-${namingPrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: environment == 'dev' ? 1 : -1 // 1GB cap for dev
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output workspaceId string = logAnalyticsWorkspace.id
output workspaceName string = logAnalyticsWorkspace.name
output workspaceCustomerId string = logAnalyticsWorkspace.properties.customerId
