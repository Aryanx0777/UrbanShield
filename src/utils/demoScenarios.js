import { agents } from '../data/agents.js';

function buildAgents(demandOverrides = {}, priorityOverrides = {}) {
  return agents.map((agent) => {
    const baseDemand = demandOverrides[agent.id] ?? agent.baseDemand;

    return {
      ...agent,
      priority: priorityOverrides[agent.id] ?? agent.priority,
      baseDemand,
      demand: baseDemand,
    };
  });
}

export const demoScenarios = [
  {
    name: 'Flood - High Severity',
    description:
      'Hospitals and water systems face elevated demand while available power is reduced.',
    input: {
      city: 'Bangalore',
      scenario: 'flood',
      severity: 9,
      totalPower: 145,
      agents: buildAgents({
        'manipal-hospital': 48,
        'apollo-hospital': 44,
        bwssb: 34,
      }),
    },
  },
  {
    name: 'Extreme Power Failure',
    description:
      'A citywide outage leaves very low available power and forces severe allocation cuts.',
    input: {
      city: 'Bangalore',
      scenario: 'power_failure',
      severity: 10,
      totalPower: 75,
      agents: buildAgents({
        bescom: 48,
        'manipal-hospital': 42,
        'apollo-hospital': 38,
        'fire-services': 30,
        bwssb: 28,
      }),
    },
  },
  {
    name: 'Chemical Leak',
    description:
      'Emergency response demand spikes while hospitals remain under sustained pressure.',
    input: {
      city: 'Bangalore',
      scenario: 'chemical',
      severity: 8,
      totalPower: 130,
      agents: buildAgents(
        {
          'fire-services': 52,
          'manipal-hospital': 40,
          'apollo-hospital': 38,
        },
        {
          'fire-services': 'critical',
        },
      ),
    },
  },
];
