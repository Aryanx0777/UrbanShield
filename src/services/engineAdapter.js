import { allocateResources } from './allocationEngine.js';

function isValidInput(input) {
  return (
    input &&
    typeof input.totalPower === 'number' &&
    Array.isArray(input.agents) &&
    input.agents.length > 0
  );
}

function getSeverityMultiplier(agent, severity) {
  if (agent.priority === 'critical') {
    return 1 + severity / 8;
  }

  return 1 + severity / 12;
}

function getAgentDemand(agent, severity) {
  const baseDemand = agent.demand ?? agent.baseDemand;

  if (typeof baseDemand === 'number' && typeof severity === 'number') {
    return baseDemand * getSeverityMultiplier(agent, severity);
  }

  return 0;
}

function addShortageMetadata(input, allocationResult) {
  const agentMap = new Map(input.agents.map((agent) => [agent.name, agent]));

  return allocationResult.map((result) => {
    const agent = agentMap.get(result.name) || {};
    const demand = getAgentDemand(agent, input.severity);
    const allocated = Number.isFinite(result.allocated) ? result.allocated : 0;
    const shortageAmount = Math.max(demand - allocated, 0);

    return {
      ...result,
      demand,
      priority: agent.priority ?? 'unknown',
      shortage: shortageAmount > 0,
      shortageAmount,
    };
  });
}

export function getShortageSummary(allocationResult) {
  return allocationResult.reduce(
    (summary, result) => {
      const shortageAmount = Number.isFinite(result.shortageAmount)
        ? result.shortageAmount
        : 0;

      return {
        totalUnmetDemand: summary.totalUnmetDemand + shortageAmount,
        affectedCriticalServices:
          result.shortage && result.priority === 'critical'
            ? summary.affectedCriticalServices + 1
            : summary.affectedCriticalServices,
      };
    },
    {
      totalUnmetDemand: 0,
      affectedCriticalServices: 0,
    },
  );
}

export function runAllocation(input) {
  try {
    if (!isValidInput(input)) {
      return [];
    }

    const allocationResult = allocateResources(input);
    return addShortageMetadata(input, allocationResult);
  } catch (error) {
    console.error('Allocation failed:', error);
    return [];
  }
}
