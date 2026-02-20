// ============================================================================
// Azure Key Vault Module - Djoppie-Paparazzi
// ============================================================================
// Description: Deploys Azure Key Vault for HR Admin secrets management
// Tier: Standard (software-protected keys)
// Cost: ~EUR 0.03/10k operations
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Unique suffix for globally unique names')
param uniqueSuffix string

@description('Resource tags')
param tags object

@description('Microsoft Entra Tenant ID')
param entraTenantId string

@description('Enable soft delete (recommended)')
param enableSoftDelete bool = true

@description('Soft delete retention in days')
@minValue(7)
@maxValue(90)
param softDeleteRetentionDays int = 7

@description('Enable purge protection (production only)')
param enablePurgeProtection bool = false

// ============================================================================
// VARIABLES
// ============================================================================

// Key Vault names must be 3-24 characters
var keyVaultName = 'kv-paparazzi-${environment}-${uniqueSuffix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: entraTenantId
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionDays
    enablePurgeProtection: enablePurgeProtection ? true : null
    enableRbacAuthorization: true // Use Azure RBAC (modern standard)

    // Network settings
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: environment == 'prod' ? 'Deny' : 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }

    // Access policies - using RBAC instead
    accessPolicies: []
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
