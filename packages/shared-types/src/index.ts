export interface ModelInfo {
  id: string;
  name: string;
  sizeBytes: number;
  downloadUrl: string;
  quantization: '4bit' | '8bit';
}

export interface User {
  id: string;
  email: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  startUrl: string;
  allowedSkills: string[];
  lastRunAt?: string;
  lastResult?: AgentResult;
}

export interface AgentResult {
  summary: string;
  links: string[];
  createdAt: string;
}

export interface ModelManifest extends ModelInfo {
  format: 'mlx';
  repository: string;
  status: 'available';
}
