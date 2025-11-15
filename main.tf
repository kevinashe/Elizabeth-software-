locals {
  name_prefix = "${var.prefix}-${var.env}"
  location    = var.location
  rg_name     = var.resource_group_name
}

resource "azurerm_resource_group" "rg" {
  name     = local.rg_name
  location = local.location
  tags = {
    env   = var.env
    owner = "platform"
  }
}

module "acr" {
  source              = "./modules/acr"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  prefix              = local.name_prefix
  sku                 = var.acr_sku
}

module "keyvault" {
  source              = "./modules/keyvault"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  prefix              = local.name_prefix
  admin_object_ids    = var.admin_object_ids
}

module "aks" {
  source              = "./modules/aks"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  prefix              = local.name_prefix
  node_count          = var.aks_node_count
  node_vm_size        = var.aks_node_vm_size
  acr_id              = module.acr.acr_id
  keyvault_id         = module.keyvault.keyvault_id
  admin_object_ids    = var.admin_object_ids
  enable_azure_policy = var.enable_azure_policy
}
