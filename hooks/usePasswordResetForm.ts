"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import { passwordViolation } from "@/lib/validations/password";

interface UsePasswordResetFormOptions {
  /** Performs the actual API call for the new password. Throwing aborts the submit. */
  onSubmit: (password: string) => Promise<void>;
  /** Shown when onSubmit throws. */
  submitErrorMessage: string;
}

/** Shared state/validation for the complete-invite and reset-password forms:
 * same password rule (lib/validations/password) + match rule, same loading/error lifecycle. Each page only
 * supplies its own API call, redirect, and error copy. */
export function usePasswordResetForm({ onSubmit, submitErrorMessage }: UsePasswordResetFormOptions) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const violation = passwordViolation(password);
    if (violation) {
      setError(violation);
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
