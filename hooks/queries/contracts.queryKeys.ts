export const contractsQueryKeys = {
  all: ["contracts"] as const,
  list: () => [...contractsQueryKeys.all] as const,
  detail: (id: number) => [...contractsQueryKeys.all, "detail", id] as const,
};