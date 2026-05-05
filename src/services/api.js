import { runAllocation } from './engineAdapter.js';
import { enhanceAllocation } from './aiEnhancer.js';
import { generateInsights } from '../utils/insightGenerator.js';

function getNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
  return Number(value.toFixed(2));
}

function buildSummary(allocation) {
  const totalDemand = allocation.reduce(
    (total, item) => total + getNumber(item.demand),
    0,
  );
  const totalAllocated = allocation.reduce(
    (total, item) => total + getNumber(item.allocated),
    0,
  );

  return {
    totalDemand: formatNumber(totalDemand),
    totalAllocated: formatNumber(totalAllocated),
    totalShortage: formatNumber(Math.max(totalDemand - totalAllocated, 0)),
    criticalShortageCount: allocation.filter(
      (item) => item.priority === 'critical' && item.shortage,
    ).length,
  };
}

export async function getAllocation(input) {
  await new Promise((resolve) => {
    setTimeout(resolve, 700);
  });

  const allocationResult = runAllocation(input);
  const allocation = await enhanceAllocation(input, allocationResult);

  return {
    allocation,
    summary: buildSummary(allocation),
    insights: generateInsights(allocation),
  };
}

export async function runSimulation(input) {
  const severityFactor = input.severity / 5;
  const baseAgents = [
    {
      name: 'Manipal Hospital',
      type: 'hospital',
      priority: 'critical',
      baseDemand: 35,
      reasoning: 'Critical hospital demand prioritized for emergency response.',
    },
    {
      name: 'Apollo Hospital',
      type: 'hospital',
      priority: 'critical',
      baseDemand: 32,
      reasoning: 'Critical care capacity receives high priority allocation.',
    },
    {
      name: 'Fire Services',
      type: 'emergency',
      priority: 'high',
      baseDemand: 28,
      reasoning: 'Emergency services are prioritized for fast incident response.',
    },
    {
      name: 'BESCOM',
      type: 'power',
      priority: 'high',
      baseDemand: 24,
      reasoning: 'Power restoration supports critical infrastructure continuity.',
    },
    {
      name: 'BWSSB',
      type: 'water',
      priority: 'medium',
      baseDemand: 20,
      reasoning: 'Water services receive support after critical and high priorities.',
    },
  ];
  const scenarioMultipliers = {
    flood: {
      hospital: 1.2,
      emergency: 1.5,
      power: 1.1,
      water: 1.4,
    },
    chemical: {
      hospital: 1.5,
      emergency: 1.4,
      power: 1,
      water: 1.1,
    },
    fire: {
      hospital: 1.3,
      emergency: 1.7,
      power: 1.2,
      water: 1.1,
    },
    power_failure: {
      hospital: 1.4,
      emergency: 1.2,
      power: 1.8,
      water: 1.2,
    },
  };
  const priorityWeights = {
    critical: 1.4,
    high: 1.1,
    medium: 0.8,
    low: 0.6,
  };
  const multipliers = scenarioMultipliers[input.scenario] ?? scenarioMultipliers.flood;
  const demandAgents = baseAgents.map((agent) => ({
    ...agent,
    demand: Math.round(agent.baseDemand * (multipliers[agent.type] ?? 1) * severityFactor),
  }));
  const weightedDemand = demandAgents.reduce(
    (sum, agent) => sum + agent.demand * priorityWeights[agent.priority],
    0
  );
  const allocation = demandAgents.map((agent) => {
    const share = weightedDemand
      ? (agent.demand * priorityWeights[agent.priority]) / weightedDemand
      : 0;
    const allocated = Math.min(agent.demand, Math.round(input.totalPower * share));
    const shortageAmount = Math.max(agent.demand - allocated, 0);

    return {
      name: agent.name,
      allocated,
      demand: agent.demand,
      priority: agent.priority,
      shortage: shortageAmount > 0,
      shortageAmount,
      reasoning: agent.reasoning,
    };
  });
  const summary = allocation.reduce(
    (totals, agent) => ({
      totalDemand: totals.totalDemand + agent.demand,
      totalAllocated: totals.totalAllocated + agent.allocated,
      totalShortage: totals.totalShortage + agent.shortageAmount,
      criticalShortageCount:
        totals.criticalShortageCount +
        (agent.priority === 'critical' && agent.shortage ? 1 : 0),
    }),
    {
      totalDemand: 0,
      totalAllocated: 0,
      totalShortage: 0,
      criticalShortageCount: 0,
    }
  );

  return {
    allocation,
    summary,
    insights: [
      `${input.scenario} simulation completed for ${input.city}.`,
      `Severity ${input.severity}/10 generated total demand of ${summary.totalDemand}.`,
      summary.totalShortage > 0
        ? `${summary.totalShortage} units remain unmet after allocation.`
        : 'All demand was satisfied by available power.',
    ],
  };
}
