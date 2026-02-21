// ============================================================================
// Application Insights Module - Djoppie-Hive
// ============================================================================
// Description: Deploys Application Insights for HR Admin monitoring
// Tier: Per-GB (Free tier: 5GB/month)
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

@description('Log Analytics Workspace resource ID')
param logAnalyticsWorkspaceId string

@description('Retention in days')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

// ============================================================================
// VARIABLES
// ============================================================================

var appInsightsName = 'appi-${namingPrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId
    RetentionInDays: retentionInDays
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    IngestionMode: 'LogAnalytics'
    DisableIpMasking: false
    DisableLocalAuth: false
    ForceCustomerStorageForProfiler: false
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appInsightsId string = appInsights.id
output appInsightsName string = appInsights.name
output instrumentationKey string = appInsights.properties.InstrumentationKey
output connectionString string = appInsights.properties.ConnectionString
