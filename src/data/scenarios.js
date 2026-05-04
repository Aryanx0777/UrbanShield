export const scenarios = {
  flood: {
    label: 'Flood',
    totalPower: 90,
    multipliers: {
      hospital: 1.2,
      emergency: 1.5,
      power: 1.1,
      water: 1.4,
    },
  },
  chemical: {
    label: 'Chemical',
    totalPower: 85,
    multipliers: {
      hospital: 1.5,
      emergency: 1.4,
      power: 1,
      water: 1.1,
    },
  },
  fire: {
    label: 'Fire',
    totalPower: 80,
    multipliers: {
      hospital: 1.3,
      emergency: 1.7,
      power: 1.2,
      water: 1.1,
    },
  },
  power_failure: {
    label: 'Power Failure',
    totalPower: 75,
    multipliers: {
      hospital: 1.4,
      emergency: 1.2,
      power: 1.8,
      water: 1.2,
    },
  },
};
