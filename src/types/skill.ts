export interface SkillInfo {
  name: string;
  description: string;
  scope: "user" | "project";
  project_path: string | null;
  dir_name: string;
  plugin_name: string | null;
}
