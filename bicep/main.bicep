@description('Deployment prefix (e.g., plat-dev)')
param prefix string

@description('Location')
param location string = resourceGroup().location

@description('Environment tag')
param env string = 'dev'

@description('Tags')
param tags object = {
  owner: 'platform'
  env: env
}

@description('Admin object ids (Azure AD object IDs for admins)')
param adminObjectIds array = []

@description('ACR SKU')
param acrSku string = 'Standard'

@description('AKS node count')
param aksNodeCount int = 3

@description('AKS node VM size')
param aksNodeVmSize string = 'Standard_D4s_v3'

@description('Log Analytics workspace resource id')
param logAnalyticsWorkspaceId string = ''

module acrModule 'modules/acr.bicep' = {
  name: 'acrDeployment'
  params: {
    prefix: prefix
    location: location
    sku: acrSku
    tags: tags
  }
}

module kvModule 'modules/keyvault.bicep' = {
  name: 'kvDeployment'
  params: {
    prefix: prefix
    location: location
    adminObjectIds: adminObjectIds
    enablePurgeProtection: false
    enableSoftDelete: true
    tags: tags
  }
}

module aksModule 'modules/aks.bicep' = {
  name: 'aksDeployment'
  params: {
    prefix: prefix
    location: location
    nodeCount: aksNodeCount
    nodeVmSize: aksNodeVmSize
    acrResourceId: acrModule.outputs.acrId
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
    adminObjectIds: adminObjectIds
    tags: tags
  }
}

output acrName string = acrModule.outputs.acrName
output acrLoginServer string = acrModule.outputs.acrLoginServer
output keyVaultUri string = kvModule.outputs.keyVaultUri
output keyVaultName string = kvModule.outputs.keyVaultName
output aksName string = aksModule.outputs.aksName
output aksId string = aksModule.outputs.aksId
output aksFqdn string = aksModule.outputs.aksFqdn
