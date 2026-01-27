import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService, type UserUpsertPayload } from "@/services/users.service";
import { usersQueryKeys } from "@/hooks/useUsers";

type UpsertUserParams = {
  id?: number;
  payload: UserUpsertPayload;
};

export function useUpsertUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpsertUserParams) => {
      return id
        ? usersService.update(id, payload)
        : usersService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}