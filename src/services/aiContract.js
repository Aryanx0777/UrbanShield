export const allocationInputExample = {
  city: 'Bangalore',
  scenario: 'flood',
  totalPower: 90,
  agents: [
    {
      name: 'Manipal Hospital',
      type: 'hospital',
      demand: 42,
      priority: 'critical',
    },
  ],
};

export const allocationOutputExample = [
  {
    name: 'Manipal Hospital',
    allocated: 42,
    reasoning: 'Critical hospital demand is prioritized for flood response.',
  },
];

/*
Input format:
{
  city: "Bangalore",
  scenario: string,
  totalPower: number,
  agents: [
    {
      name: string,
      type: string,
      demand: number,
      priority: string
    }
  ]
}

Expected output format:
[
  {
    name: string,
    allocated: number,
    reasoning: string
  }
]
*/
