use crate::models::account::AccountInfo;
use crate::services::account_reader;

#[tauri::command]
pub async fn read_account_info() -> Result<AccountInfo, String> {
    account_reader::read_account_info().await
}
