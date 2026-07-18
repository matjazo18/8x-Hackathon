// MLC LLM inference service
// Install react-native-mlc-llm manually — see README for setup instructions

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMService {
  loadModel(modelId: string): Promise<void>;
  generate(messages: ChatMessage[], onToken?: (token: string) => void): Promise<string>;
  unloadModel(): Promise<void>;
}

export const MODEL_ID = 'qwen3-1.7b-mlx-4bit';

// Placeholder — replace with real MLC LLM implementation after installing the native module
class MockLLMService implements LLMService {
  async loadModel(_modelId: string): Promise<void> {
    console.warn('LLM service not yet implemented — using mock');
  }

  async generate(messages: ChatMessage[], _onToken?: (token: string) => void): Promise<string> {
    const last = messages[messages.length - 1];
    return `[mock] received: ${last?.content ?? ''}`;
  }

  async unloadModel(): Promise<void> {}
}

export const llmService: LLMService = new MockLLMService();

// Native hook: mlx-swift-lm bo kasneje implementiral isti vmesnik prek Expo/Turbo modula.
