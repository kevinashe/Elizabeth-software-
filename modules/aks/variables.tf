variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "prefix" {
  type = string
}

variable "node_count" {
  type    = number
  default = 3
}

variable "node_vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

variable "acr_id" {
  type = string
}

variable "keyvault_id" {
  type = string
}

variable "admin_object_ids" {
  type    = list(string)
  default = []
}

variable "log_analytics_workspace_id" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "enable_azure_policy" {
  type    = bool
  default = true
}

variable "extra_system_node_pool" {
  type    = bool
  default = false
}

variable "system_node_vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

variable "system_node_count" {
  type    = number
  default = 1
}
