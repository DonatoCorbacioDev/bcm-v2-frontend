"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFieldsProps {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  passwordLabel?: string;
  error?: string;
}

export function PasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  passwordLabel = "Nuova password",
  error,
}: Readonly<PasswordFieldsProps>) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password">{passwordLabel}</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Conferma password</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </>
  );
}
