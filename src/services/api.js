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
