export interface AccountInfo {
  accountUuid: string | null;
  emailAddress: string | null;
  organizationUuid: string | null;
  hasExtraUsageEnabled: boolean | null;
  billingType: string | null;
  subscriptionCreatedAt: string | null;
  displayName: string | null;
  organizationRole: string | null;
  workspaceRole: string | null;
  organizationName: string | null;
}
