import { runAllocation } from './engineAdapter.js';

export async function getAllocation(input) {
  await new Promise((resolve) => {
    setTimeout(resolve, 700);
  });

  return runAllocation(input);
}
