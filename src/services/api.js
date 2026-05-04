export async function getAllocation(input) {
  console.log('Allocation input:', input);

  return [
    {
      name: 'Manipal Hospital',
      allocated: 35,
      reasoning: 'Mock allocation for base project setup.',
    },
    {
      name: 'Apollo Hospital',
      allocated: 30,
      reasoning: 'Mock allocation for base project setup.',
    },
  ];
}
