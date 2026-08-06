"use client";

import { useState } from "react";

interface UsePasswordResetFormOptions {
  /** Performs the actual API call for the new password. Throwing aborts the submit. */
  onSubmit: (password: string) => Promise<void>;
  /** Shown when onSubmit throws. */
  submitErrorMessage: string;
}

/** Shared state/validation for the complete-invite and reset-password forms:
 * same min-length + match rule, same loading/error lifecycle. Each page only
 * supplies its own API call, redirect, and error copy. */
export function usePasswordResetForm({ onSubmit, submitErrorMessage }: UsePasswordResetFormOptions) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(password);
    } catch {
      setError(submitErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { password, setPassword, confirm, setConfirm, isLoading, error, handleSubmit };
}
