// ============================================================================
// Azure SQL Server Module - DEV Environment - Djoppie-Paparazzi
// ============================================================================
// Description: Deploys Azure SQL Server with Serverless database for HR data
// Tier: GP_S_Gen5_1 (0.5-1 vCore, auto-pause enabled)
// Cost: ~EUR 4-6/month (with auto-pause)
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Unique suffix for globally unique names')
param uniqueSuffix string

@description('Resource tags')
param tags object

@description('SQL Server administrator username')
@secure()
param sqlAdminUsername string

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('Microsoft Entra Tenant ID')
param entraTenantId string

@description('Database name')
param databaseName string = 'sqldb-${namingPrefix}'

@description('Auto-pause delay in minutes (-1 to disable)')
@minValue(-1)
@maxValue(10080)
param autoPauseDelay int = 60 // 1 hour

@description('Minimum vCore capacity')
@allowed([
  '0.5'
  '0.75'
  '1'
])
param minCapacity string = '0.5'

@description('Maximum vCore capacity')
@allowed([
  '1'
  '2'
  '4'
])
param maxCapacity string = '1'

@description('Maximum data size in GB')
param maxSizeBytes int = 34359738368 // 32 GB

// ============================================================================
// VARIABLES
// ============================================================================

var sqlServerName = 'sql-paparazzi-${environment}-${uniqueSuffix}'

// ============================================================================
// RESOURCES
// ============================================================================

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Firewall rule - Allow Azure services
resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Serverless SQL Database for HR data
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: int(maxCapacity)
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: maxSizeBytes
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
    isLedgerOn: false

    // Serverless-specific settings
    autoPauseDelay: autoPauseDelay
    minCapacity: json(minCapacity)
  }
}

// Transparent Data Encryption (enabled by default - important for HR data)
resource transparentDataEncryption 'Microsoft.Sql/servers/databases/transparentDataEncryption@2023-08-01-preview' = {
  parent: sqlDatabase
  name: 'current'
  properties: {
    state: 'Enabled'
  }
}

// Database auditing (for GDPR compliance - enabled even in DEV)
resource auditingSettings 'Microsoft.Sql/servers/auditingSettings@2023-08-01-preview' = {
  parent: sqlServer
  name: 'default'
  properties: {
    state: 'Enabled'
    isAzureMonitorTargetEnabled: true
    retentionDays: 30
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output sqlServerId string = sqlServer.id
output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseId string = sqlDatabase.id
output databaseName string = sqlDatabase.name
