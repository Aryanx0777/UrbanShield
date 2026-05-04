import { agents } from '../data/agents.js';

export function getSampleInput() {
  return {
    city: 'Bangalore',
    scenario: 'flood',
    severity: 8,
    totalPower: 180,
    agents: agents.map((agent) => ({
      ...agent,
      demand: agent.baseDemand,
    })),
  };
}
