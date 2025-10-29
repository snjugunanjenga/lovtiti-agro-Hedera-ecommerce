export function getContractAddress(): string {
  return (
    process.env.AGRO_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_CONTRACT ||
    process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS ||
    ''
  );
}
