// ============================================================================
// Key Vault RBAC Module - Djoppie-Hive
// ============================================================================
// Description: Grants App Service Managed Identity access to Key Vault
// Using Azure RBAC instead of access policies (modern standard)
// ============================================================================

@description('Key Vault name')
param keyVaultName string

@description('App Service Managed Identity Principal ID')
param appServicePrincipalId string

// ============================================================================
// VARIABLES
// ============================================================================

// Key Vault Secrets User role - allows reading secrets
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Grant App Service the "Key Vault Secrets User" role
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appServicePrincipalId, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output roleAssignmentId string = keyVaultRoleAssignment.id
