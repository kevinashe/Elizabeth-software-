resource "azurerm_container_registry" "acr" {
  name                = replace(substr("${var.prefix}acr", 0, 50), "-", "")
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  admin_enabled       = false
  georeplications     = []
  tags                = var.tags
}

resource "azurerm_role_assignment" "acr_pull" {
  for_each             = var.acr_pull_object_ids == null ? {} : { for id in var.acr_pull_object_ids : id => id }
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = each.value
}
