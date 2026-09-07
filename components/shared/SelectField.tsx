"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectFieldOption {
  readonly value: string;
  readonly label: string;
}

interface SelectFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly placeholder: string;
  readonly options: readonly SelectFieldOption[];
  readonly error?: string;
}

/**
 * Labeled `<Select>` + option list + error message — the shape repeated for
 * every entity picker (counterparty/business area/manager/financial type/
 * status/billing frequency) across ContractForm and InstantiateTemplateDialog.
 * Field wiring (value parsing, the react-hook-form `Controller`) stays with
 * the caller; this owns only the presentational skeleton.
 */
export function SelectField({ id, label, value, onValueChange, placeholder, options, error }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
