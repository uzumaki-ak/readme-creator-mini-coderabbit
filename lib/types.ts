export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  generated_readme: string | null
  file_structure: FileNode[] | null
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_path: string
  content: string | null
  file_type: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  project_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
}
