export const contractTemplatesQueryKeys = {
  all: ["contract-templates"] as const,
  list: () => [...contractTemplatesQueryKeys.all] as const,
  detail: (id: number) => [...contractTemplatesQueryKeys.all, "detail", id] as const,
};
