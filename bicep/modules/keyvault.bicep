@description('Prefix for resource names')
param prefix string

@description('Location for resources')
param location string = resourceGroup().location

@description('Admin object ids (principal object IDs) for access policies')
param adminObjectIds array = []

@description('Enable purge protection')
param enablePurgeProtection bool = false

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Tags')
param tags object = {}

var kvName = toLower(replace('${prefix}kv', '-', ''))

resource kv 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: kvName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: [
      for admin in adminObjectIds: {
        tenantId: subscription().tenantId
        objectId: admin
        permissions: {
          certificates: [
            'get'
            'list'
          ]
          keys: [
            'get'
            'list'
            'create'
            'delete'
          ]
          secrets: [
            'get'
            'list'
            'set'
            'delete'
          ]
        }
      }
    ]
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enablePurgeProtection: enablePurgeProtection ? true : null
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: enableSoftDelete ? 7 : null
  }
  tags: tags
}

output keyVaultId string = kv.id
output keyVaultName string = kv.name
output keyVaultUri string = kv.properties.vaultUri
