use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountInfo {
    pub account_uuid: Option<String>,
    pub email_address: Option<String>,
    pub organization_uuid: Option<String>,
    pub has_extra_usage_enabled: Option<bool>,
    pub billing_type: Option<String>,
    pub subscription_created_at: Option<String>,
    pub display_name: Option<String>,
    pub organization_role: Option<String>,
    pub workspace_role: Option<String>,
    pub organization_name: Option<String>,
}
