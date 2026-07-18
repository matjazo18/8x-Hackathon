import { models, useLLM } from 'react-native-executorch';
import type { SiolNewsItem } from './siolNewsSkill';

export const LOCAL_AI_MODEL_NAME = 'Qwen3 0.6B (on-device)';

const localModel = models.llm.qwen3_0_6b();

export function useLocalAI(enabled: boolean) {
  return useLLM({ model: localModel, preventLoad: !enabled });
}

export function makeSiolNewsPrompt(items: SiolNewsItem[]) {
  const headlines = items.map((item, index) => `${index + 1}. ${item.title}`).join('\n');
  return `Spodaj je pet najnovejših naslovov s Siol.net. Napiši samo en kratek uvodni stavek v slovenščini, ki pove, da si jih našel. Ne spreminjaj naslovov in ne dodajaj dejstev.\n\n${headlines}`;
}
