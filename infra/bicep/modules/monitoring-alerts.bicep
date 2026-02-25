// ============================================================================
// Monitoring Alerts Module - Djoppie-Hive (Task 6.5)
// ============================================================================
// Description: Deploys Azure Monitor alert rules for HR Admin API
// Includes: Health check alerts, error rate alerts, performance alerts
// Cost: Free within basic limits
// ============================================================================

@description('Azure region for the resource')
param location string

@description('Environment name (dev/prod)')
param environment string

@description('Naming prefix for resources')
param namingPrefix string

@description('Resource tags')
param tags object

@description('Application Insights resource ID')
param appInsightsId string

@description('App Service resource ID')
param appServiceId string

@description('Email addresses for alert notifications')
param alertEmailAddresses array = []

@description('Enable alert rules')
param enableAlerts bool = true

// ============================================================================
// VARIABLES
// ============================================================================

var actionGroupName = 'ag-${namingPrefix}-alerts'

// ============================================================================
// ACTION GROUP
// ============================================================================

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = if (enableAlerts && length(alertEmailAddresses) > 0) {
  name: actionGroupName
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    groupShortName: 'HiveAlerts'
    emailReceivers: [for (email, i) in alertEmailAddresses: {
      name: 'EmailReceiver${i}'
      emailAddress: email
      useCommonAlertSchema: true
    }]
  }
}

// ============================================================================
// ALERT RULES
// ============================================================================

// Alert 1: API Health Check Failure
resource healthCheckAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-${namingPrefix}-health-failure'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when API health endpoint returns errors'
    severity: 1  // Critical
    enabled: enableAlerts
    scopes: [appServiceId]
    evaluationFrequency: 'PT5M'  // Every 5 minutes
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HealthCheckFailure'
          metricName: 'HealthCheckStatus'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'LessThan'
          threshold: 100  // Health check returns < 100% healthy
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: length(alertEmailAddresses) > 0 ? [
      {
        actionGroupId: actionGroup.id
      }
    ] : []
  }
}

// Alert 2: High HTTP 5xx Error Rate
resource serverErrorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-${namingPrefix}-server-errors'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when HTTP 5xx error rate exceeds threshold'
    severity: 1  // Critical
    enabled: enableAlerts
    scopes: [appServiceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Http5xxErrors'
          metricName: 'Http5xx'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 10  // More than 10 errors in 15 minutes
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: length(alertEmailAddresses) > 0 ? [
      {
        actionGroupId: actionGroup.id
      }
    ] : []
  }
}

// Alert 3: High Response Time
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-${namingPrefix}-response-time'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when average response time exceeds 5 seconds'
    severity: 2  // Warning
    enabled: enableAlerts
    scopes: [appServiceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighResponseTime'
          metricName: 'HttpResponseTime'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 5  // 5 seconds
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: length(alertEmailAddresses) > 0 ? [
      {
        actionGroupId: actionGroup.id
      }
    ] : []
  }
}

// Alert 4: High CPU Usage
resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-${namingPrefix}-high-cpu'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when CPU usage exceeds 80%'
    severity: 2  // Warning
    enabled: enableAlerts
    scopes: [appServiceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCPU'
          metricName: 'CpuPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: length(alertEmailAddresses) > 0 ? [
      {
        actionGroupId: actionGroup.id
      }
    ] : []
  }
}

// Alert 5: High Memory Usage
resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-${namingPrefix}-high-memory'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when memory usage exceeds 80%'
    severity: 2  // Warning
    enabled: enableAlerts
    scopes: [appServiceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighMemory'
          metricName: 'MemoryPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: length(alertEmailAddresses) > 0 ? [
      {
        actionGroupId: actionGroup.id
      }
    ] : []
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output actionGroupId string = enableAlerts && length(alertEmailAddresses) > 0 ? actionGroup.id : ''
output healthCheckAlertId string = enableAlerts ? healthCheckAlert.id : ''
output serverErrorAlertId string = enableAlerts ? serverErrorAlert.id : ''
output responseTimeAlertId string = enableAlerts ? responseTimeAlert.id : ''
