import { getAllocation } from './api.js';

/**
 * Stable simulation entry point for the frontend.
 * 
 * @param {Object} input - The simulation input data.
 * @returns {Promise<Object>} The processed, UI-ready simulation response.
 */
export async function runSimulation(input) {
  try {
    // Validate input
    if (!input || !Array.isArray(input.agents) || typeof input.totalPower === 'undefined') {
      throw new Error('Invalid input: agents array and totalPower are required.');
    }

    // Call the API layer to get allocation
    const result = await getAllocation(input);
    return result;

  } catch (error) {
    console.error('Simulation failed:', error);

    // Return safe fallback object
    return {
      allocation: [],
      summary: {
        totalDemand: 0,
        totalAllocated: 0,
        totalShortage: 0,
        criticalShortageCount: 0
      },
      insights: []
    };
  }
}
