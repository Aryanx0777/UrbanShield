import { allocateResources } from './allocationEngine.js';

function isValidInput(input) {
  return (
    input &&
    typeof input.totalPower === 'number' &&
    Array.isArray(input.agents) &&
    input.agents.length > 0
  );
}

export function runAllocation(input) {
  try {
    if (!isValidInput(input)) {
      return [];
    }

    return allocateResources(input);
  } catch (error) {
    console.error('Allocation failed:', error);
    return [];
  }
}
