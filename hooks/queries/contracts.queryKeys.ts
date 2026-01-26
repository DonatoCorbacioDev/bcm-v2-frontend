export const contractsQueryKeys = {
  all: ["contracts"] as const,
  list: () => [...contractsQueryKeys.all] as const,
};