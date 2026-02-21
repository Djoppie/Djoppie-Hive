// ============================================================================
// Azure Static Web App Module - Djoppie-Hive
// ============================================================================
// Description: Deploys Azure Static Web App for React HR Admin frontend
// Tier: Free (100 GB bandwidth, 0.5 GB storage)
// Cost: EUR 0/month
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('SKU name (Free or Standard)')
@allowed([
  'Free'
  'Standard'
])
param skuName string = 'Free'

@description('Backend API URL for CORS configuration')
param backendApiUrl string

// ============================================================================
// VARIABLES
// ============================================================================

var staticWebAppName = 'swa-${namingPrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuName
  }
  properties: {
    repositoryUrl: ''
    branch: ''
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppApiKey string = staticWebApp.listSecrets().properties.apiKey
