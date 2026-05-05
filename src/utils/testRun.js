import { getAllocation } from '../services/api.js';
import { getSampleInput } from './sampleInput.js';

const input = getSampleInput();
const result = await getAllocation(input);

console.log(result);
