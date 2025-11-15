@description('Prefix for resource names')
param prefix string

@description('Location for resources')
param location string = resourceGroup().location

@description('SKU for ACR: Basic, Standard, Premium')
param sku string = 'Standard'

@description('Tags')
param tags object = {}

var acrName = toLower(replace('${prefix}acr', '-', ''))

resource acr 'Microsoft.ContainerRegistry/registries@2022-02-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
  }
  tags: tags
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output acrId string = acr.id
