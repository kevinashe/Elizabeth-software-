data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "kv" {
  name                            = replace(substr("${var.prefix}kv", 0, 24), "-", "")
  location                        = var.location
  resource_group_name             = var.resource_group_name
  tenant_id                       = data.azurerm_client_config.current.tenant_id
  sku_name                        = "standard"
  purge_protection_enabled        = false
  soft_delete_retention_days      = 7
  enabled_for_deployment          = true
  enabled_for_disk_encryption     = true
  enabled_for_template_deployment = true

  tags = var.tags
}

resource "azurerm_key_vault_access_policy" "admin" {
  for_each     = toset(var.admin_object_ids)
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = each.value

  secret_permissions = ["Get", "List", "Set", "Delete", "Recover", "Purge"]
  key_permissions    = ["Get", "List", "Create", "Update", "Delete"]
}
