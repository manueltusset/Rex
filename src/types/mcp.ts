export interface McpServerStatus {
  name: string;
  server_type: "stdio" | "http" | "sse";
  scope: "local" | "project" | "user";
  project_path: string | null;
  status: "ok" | "error" | "unknown";
  error_message: string | null;
  url: string | null;
  command: string | null;
}
