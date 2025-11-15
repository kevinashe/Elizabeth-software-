output "aks_cluster_name" {
  value = module.aks.aks_name
}

output "acr_name" {
  value = module.acr.acr_name
}

output "keyvault_id" {
  value = module.keyvault.keyvault_id
}
