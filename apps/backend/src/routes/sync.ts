import { Router } from 'express';
import { Agent, AgentResult } from '@8x/shared-types';

const router = Router();

const agents: Agent[] = [
  {
    id: 'daily-news',
    name: 'Današnje novice',
    description: 'Poišče glavne novice in vrne pet kratkih povzetkov.',
    startUrl: 'https://siol.net',
    allowedSkills: ['web.fetch', 'web.extract', 'summarize'],
  },
];

router.get('/agents', (_req, res) => res.json({ agents }));

router.post('/agents', (req, res) => {
  const { name, description, startUrl, allowedSkills = [] } = req.body ?? {};
  if (!name || !description || !startUrl) {
    return res.status(400).json({ error: 'name, description and startUrl are required' });
  }
  const agent: Agent = {
    id: `agent-${Date.now()}`,
    name: String(name),
    description: String(description),
    startUrl: String(startUrl),
    allowedSkills: Array.isArray(allowedSkills) ? allowedSkills.map(String) : [],
  };
  agents.push(agent);
  return res.status(201).json(agent);
});

router.post('/agents/:id/runs', (req, res) => {
  const agent = agents.find((item) => item.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  // Začetni backend kontrakt. Dejanski fetch + MLX inference se izvedeta na napravi.
  const result: AgentResult = {
    summary: `Agent je pripravljen za zagon na ${agent.startUrl}. Lokalni model bo obdelal vsebino.` ,
    links: [agent.startUrl],
    createdAt: new Date().toISOString(),
  };
  agent.lastRunAt = result.createdAt;
  agent.lastResult = result;
  return res.json({ agent, result });
});

export default router;
