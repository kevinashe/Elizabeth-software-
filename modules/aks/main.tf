data "azurerm_client_config" "current" {}

resource "random_pet" "aksprefix" {
  length = 2
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = substr("${var.prefix}-aks-${random_pet.aksprefix.id}", 0, 63)
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = substr("${var.prefix}-aks", 0, 45)

  default_node_pool {
    name            = "agentpool"
    node_count      = var.node_count
    vm_size         = var.node_vm_size
    os_disk_size_gb = 100
    type            = "VirtualMachineScaleSets"
    max_pods        = 110
  }

  identity {
    type = "SystemAssigned"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id != "" ? var.log_analytics_workspace_id : null
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
    network_policy    = "calico"
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = var.admin_object_ids
    azure_rbac_enabled     = true
  }

  tags       = var.tags
  depends_on = []
}

resource "azurerm_kubernetes_cluster_node_pool" "systempool" {
  count                 = var.extra_system_node_pool == true ? 1 : 0
  name                  = "systempool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks.id
  vm_size               = var.system_node_vm_size
  node_count            = var.system_node_count
  mode                  = "System"
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}
