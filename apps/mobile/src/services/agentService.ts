import type { Agent } from '@8x/shared-types';

const BACKEND_URL = 'http://localhost:3000';

export interface WebSource {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

export const searchAgentSources = async (agent: Agent): Promise<WebSource[]> => {
  const response = await fetch(`${BACKEND_URL}/sync/search?q=${encodeURIComponent(agent.description)}`);
  const body = await response.json() as { results?: WebSource[]; error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Spletno iskanje ni uspelo.');
  return body.results ?? [];
};
