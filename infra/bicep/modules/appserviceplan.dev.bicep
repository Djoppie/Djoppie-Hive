// ============================================================================
// App Service Plan Module - DEV Environment - Djoppie-Hive
// ============================================================================
// Description: Deploys App Service Plan for HR Admin API
// Tier: F1 Free (shared infrastructure)
// Cost: EUR 0/month
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('App Service Plan SKU')
@allowed([
  'F1'
  'B1'
  'B2'
])
param skuName string = 'F1'

@description('App Service Plan tier')
@allowed([
  'Free'
  'Basic'
])
param skuTier string = 'Free'

// ============================================================================
// VARIABLES
// ============================================================================

var appServicePlanName = 'plan-${namingPrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  kind: 'app'
  sku: {
    name: skuName
    tier: skuTier
    size: skuName
    family: skuName == 'F1' ? 'F' : 'B'
    capacity: 1
  }
  properties: {
    perSiteScaling: false
    elasticScaleEnabled: false
    maximumElasticWorkerCount: 1
    isSpot: false
    reserved: false // Windows
    isXenon: false
    hyperV: false
    targetWorkerCount: 0
    targetWorkerSizeId: 0
    zoneRedundant: false
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
