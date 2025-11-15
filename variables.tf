variable "tenant_id" {
  type = string
}

variable "subscription_id" {
  type = string
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "resource_group_name" {
  type    = string
  default = "platform-rg"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "prefix" {
  type    = string
  default = "plat"
}

variable "acr_sku" {
  type    = string
  default = "Standard"
}

variable "aks_node_count" {
  type    = number
  default = 3
}

variable "aks_node_vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

variable "enable_azure_policy" {
  type    = bool
  default = true
}

variable "admin_object_ids" {
  type    = list(string)
  default = []
}
