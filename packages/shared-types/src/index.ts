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
