import { runAllocation } from './engineAdapter.js';
import { enhanceAllocation } from './aiEnhancer.js';

export async function getAllocation(input) {
  await new Promise((resolve) => {
    setTimeout(resolve, 700);
  });

  const allocationResult = runAllocation(input);
  return enhanceAllocation(input, allocationResult);
}
