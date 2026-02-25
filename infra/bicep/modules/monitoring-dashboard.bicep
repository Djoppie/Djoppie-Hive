// ============================================================================
// Monitoring Dashboard Module - Djoppie-Hive (Task 6.5)
// ============================================================================
// Description: Deploys Azure Portal Dashboard for HR Admin monitoring
// Includes: API metrics, error tracking, performance overview
// Cost: Free
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

@description('Application Insights name')
param appInsightsName string

@description('App Service resource ID')
param appServiceId string

@description('App Service name')
param appServiceName string

@description('Subscription ID')
param subscriptionId string = subscription().subscriptionId

@description('Resource group name')
param resourceGroupName string

// ============================================================================
// VARIABLES
// ============================================================================

var dashboardName = 'dash-${namingPrefix}-monitoring'
var dashboardTitle = 'Djoppie-Hive ${toUpper(environment)} - HR Admin Monitoring'

// ============================================================================
// DASHBOARD
// ============================================================================

resource dashboard 'Microsoft.Portal/dashboards@2020-09-01-preview' = {
  name: dashboardName
  location: location
  tags: union(tags, {
    'hidden-title': dashboardTitle
  })
  properties: {
    lenses: [
      {
        order: 0
        parts: [
          // Part 1: API Requests Overview
          {
            position: {
              x: 0
              y: 0
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [appInsightsId]
                  }
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: 'requests-chart'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'PT24H'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'requests | summarize count() by bin(timestamp, 1h) | order by timestamp desc'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'FrameControlChart'
                  isOptional: true
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'requests | summarize count() by bin(timestamp, 1h) | order by timestamp desc | render timechart'
                  ControlType: 'FrameControlChart'
                  Dimensions: {
                    xAxis: {
                      name: 'timestamp'
                      type: 'datetime'
                    }
                    yAxis: [
                      {
                        name: 'count_'
                        type: 'long'
                      }
                    ]
                    aggregation: 'Sum'
                  }
                }
              }
            }
          }
          // Part 2: Failed Requests
          {
            position: {
              x: 6
              y: 0
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [appInsightsId]
                  }
                }
                {
                  name: 'Query'
                  value: 'requests | where success == false | summarize count() by bin(timestamp, 1h), resultCode | order by timestamp desc'
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'requests | where success == false | summarize count() by bin(timestamp, 1h), resultCode | order by timestamp desc | render columnchart'
                }
              }
            }
          }
          // Part 3: Response Time Metrics
          {
            position: {
              x: 0
              y: 4
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [appInsightsId]
                  }
                }
                {
                  name: 'Query'
                  value: 'requests | summarize avg(duration), percentile(duration, 95) by bin(timestamp, 1h) | order by timestamp desc'
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'requests | summarize avg(duration), percentile(duration, 95) by bin(timestamp, 1h) | order by timestamp desc | render timechart'
                }
              }
            }
          }
          // Part 4: Top Endpoints
          {
            position: {
              x: 6
              y: 4
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [appInsightsId]
                  }
                }
                {
                  name: 'Query'
                  value: 'requests | summarize count() by name | top 10 by count_'
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'requests | summarize count() by name | top 10 by count_ | render barchart'
                }
              }
            }
          }
          // Part 5: App Service CPU Metrics
          {
            position: {
              x: 0
              y: 8
              colSpan: 4
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: appServiceId
                          }
                          name: 'CpuPercentage'
                          aggregationType: 4  // Average
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'CPU Percentage'
                          }
                        }
                      ]
                      title: 'CPU Usage'
                      titleKind: 1
                      visualization: {
                        chartType: 2  // Line chart
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000  // 24 hours
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
            }
          }
          // Part 6: App Service Memory Metrics
          {
            position: {
              x: 4
              y: 8
              colSpan: 4
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: appServiceId
                          }
                          name: 'MemoryPercentage'
                          aggregationType: 4
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Memory Percentage'
                          }
                        }
                      ]
                      title: 'Memory Usage'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
            }
          }
          // Part 7: HTTP Response Codes
          {
            position: {
              x: 8
              y: 8
              colSpan: 4
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: appServiceId
                          }
                          name: 'Http2xx'
                          aggregationType: 1  // Total
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: '2xx Success'
                            color: '#47a147'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: appServiceId
                          }
                          name: 'Http4xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: '4xx Client Errors'
                            color: '#f5a623'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: appServiceId
                          }
                          name: 'Http5xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: '5xx Server Errors'
                            color: '#e81123'
                          }
                        }
                      ]
                      title: 'HTTP Response Codes'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
            }
          }
          // Part 8: Markdown - Info Panel
          {
            position: {
              x: 0
              y: 11
              colSpan: 12
              rowSpan: 2
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  content: '## Djoppie-Hive HR Admin - ${toUpper(environment)} Environment\n\n**API:** [${appServiceName}](https://portal.azure.com/#@/resource${appServiceId}/overview) | **Insights:** [${appInsightsName}](https://portal.azure.com/#@/resource${appInsightsId}/overview)\n\nDit dashboard toont de belangrijkste metrics voor het HR Admin systeem. Contacteer ICT bij problemen.'
                  title: 'Dashboard Info'
                  subtitle: 'Djoppie-Hive Monitoring'
                }
              }
            }
          }
        ]
      }
    ]
    metadata: {
      model: {
        timeRange: {
          value: {
            relative: {
              duration: 24
              timeUnit: 1
            }
          }
          type: 'MsPortalFx.Composition.Configuration.ValueTypes.TimeRange'
        }
      }
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output dashboardId string = dashboard.id
output dashboardName string = dashboard.name
