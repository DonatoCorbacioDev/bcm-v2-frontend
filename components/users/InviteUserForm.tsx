"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useManagers } from "@/hooks/useManagers";
import { useRoles } from "@/hooks/useRoles";
import { usersService, type InviteUserPayload } from "@/services/users.service";
import { usersQueryKeys } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteUserFormProps {
  readonly onClose: () => void;
}

export default function InviteUserForm({ onClose }: InviteUserFormProps) {
  const { data: managers = [] } = useManagers();
  const { data: roles = [] } = useRoles();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<InviteUserPayload>({
    username: "",
    role: "",
    managerId: 0,
  });

  const mutation = useMutation({
    mutationFn: () => usersService.invite(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
      toast.success("Invitation sent successfully!");
      onClose();
    },
    onError: () => {
      toast.error("Failed to send invitation.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.role || !form.managerId) {
      toast.error("Please fill in all fields.");
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="invite-username">Email</Label>
        <Input
          id="invite-username"
          type="email"
          placeholder="user@example.com"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="">Select a role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.role}>
              {r.role}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-manager">Manager</Label>
        <select
          id="invite-manager"
          value={form.managerId || ""}
          onChange={(e) => setForm({ ...form, managerId: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="">Select a manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {/* istanbul ignore next */mutation.isPending ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
}
