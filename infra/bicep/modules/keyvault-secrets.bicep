// ============================================================================
// Key Vault Secrets Module - Djoppie-Hive
// ============================================================================
// Description: Stores application secrets in Key Vault for HR Admin
// Secrets are referenced by App Service using Key Vault references
// ============================================================================

@description('Key Vault name')
param keyVaultName string

@description('SQL Database connection string')
@secure()
param sqlConnectionString string

@description('Microsoft Entra Tenant ID')
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

@description('Application Insights connection string')
@secure()
param appInsightsConnectionString string

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// SQL Connection String
resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: sqlConnectionString
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Entra Tenant ID
resource entraTenantIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraTenantId'
  properties: {
    value: entraTenantId
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Backend API Client ID
resource entraBackendClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientId'
  properties: {
    value: entraBackendClientId
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Backend API Client Secret
resource entraBackendClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraBackendClientSecret'
  properties: {
    value: entraBackendClientSecret
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Frontend SPA Client ID
resource entraFrontendClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EntraFrontendClientId'
  properties: {
    value: entraFrontendClientId
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Application Insights Connection String
resource appInsightsConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AppInsightsConnectionString'
  properties: {
    value: appInsightsConnectionString
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output secretNames array = [
  'SqlConnectionString'
  'EntraTenantId'
  'EntraBackendClientId'
  'EntraBackendClientSecret'
  'EntraFrontendClientId'
  'AppInsightsConnectionString'
]
