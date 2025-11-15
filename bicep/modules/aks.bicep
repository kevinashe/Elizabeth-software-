@description('Prefix for resource names')
param prefix string

@description('Location for resources')
param location string = resourceGroup().location

@description('Node pool count')
param nodeCount int = 3

@description('Node VM size')
param nodeVmSize string = 'Standard_D4s_v3'

@description('Azure Container Registry resource id (for role assignment)')
param acrResourceId string

@description('Log Analytics workspace resource id (optional, for monitoring)')
param logAnalyticsWorkspaceId string = ''

@description('Admin group/object ids for AKS AAD admin group (object ids)')
param adminObjectIds array = []

@description('Tags')
param tags object = {}

@description('Enable pod CNI network policy (calico)')
param networkPolicy string = 'calico'

@description('Enable managed AAD integration')
param enableAad bool = true

var aksName = toLower('${prefix}-aks')

resource aks 'Microsoft.ContainerService/managedClusters@2023-01-01' = {
  name: aksName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: ''
    dnsPrefix: toLower('${prefix}-aksdns')
    agentPoolProfiles: [
      {
        name: 'agentpool'
        count: nodeCount
        vmSize: nodeVmSize
        osDiskSizeGB: 100
        type: 'VirtualMachineScaleSets'
        mode: 'System'
        maxPods: 110
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      loadBalancerSku: 'standard'
      networkPolicy: networkPolicy
    }
    enableRBAC: true
    aadProfile: enableAad ? {
      managed: true
      adminGroupObjectIDs: adminObjectIds
    } : null
    apiServerAccessProfile: {
      enablePrivateCluster: false
    }
    addonProfiles: !empty(logAnalyticsWorkspaceId) ? {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
    } : {}
  }
  tags: tags
}

resource acrPullRole 'Microsoft.Authorization/roleAssignments@2020-10-01-preview' = if (!empty(acrResourceId)) {
  name: guid(aks.id, acrResourceId, 'acrpull')
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: aks.properties.identityProfile.kubeletidentity.objectId
    principalType: 'ServicePrincipal'
  }
}

output aksName string = aks.name
output aksId string = aks.id
output aksFqdn string = aks.properties.fqdn
output aksIdentityPrincipalId string = aks.identity.principalId
