"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useFinancialValues } from "@/hooks/useFinancialValues";
import { useBudgets } from "@/hooks/useBudgets";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useFinancialTypes } from "@/hooks/useFinancialTypes";
import { useContractsPaged } from "@/hooks/useContractsPaged";
import FinancialValueTable from "@/components/financial-values/FinancialValueTable";
import FinancialValueForm from "@/components/financial-values/FinancialValueForm";
import FinancialValueSummary from "@/components/financial-values/FinancialValueSummary";
import { MissingPrerequisiteBanner } from "@/components/shared/MissingPrerequisiteBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FinancialValue } from "@/types";

const ALL_YEARS = "ALL";

export default function FinancialValuesPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const businessAreasQuery = useBusinessAreas();
  const financialTypesQuery = useFinancialTypes();
  const contractsQuery = useContractsPaged({ size: 1000 });
  const missingAreas = businessAreasQuery.isSuccess && businessAreasQuery.data.length === 0;
  const missingTypes = financialTypesQuery.isSuccess && financialTypesQuery.data.length === 0;
  const missingContracts =
    contractsQuery.isSuccess && (contractsQuery.data.content?.length ?? 0) === 0;
  const hasMissingPrerequisite = missingAreas || missingTypes || missingContracts;

  const missingLabels = [
    missingContracts ? "un contratto" : null,
    missingTypes ? "un tipo finanziario" : null,
    missingAreas ? "un'area di business" : null,
  ].filter((label): label is string => label !== null);
  const adminOnlyMissing = missingTypes || missingAreas;
  const prerequisiteMessage = `Per creare un valore finanziario serve prima ${missingLabels.join(
    ", "
  )}.${!isAdmin && adminOnlyMissing ? " Contatta un amministratore per l'area di business/il tipo finanziario." : ""}`;
  const prerequisiteActions = [
    missingContracts ? { label: "Crea un contratto", href: "/contracts" } : null,
    missingTypes && isAdmin ? { label: "Crea un tipo finanziario", href: "/financial-types" } : null,
    missingAreas && isAdmin ? { label: "Crea un'area di business", href: "/business-areas" } : null,
  ].filter((action): action is { label: string; href: string } => action !== null);

  const { data: financialValues = [] } = useFinancialValues();
  const { data: budgets = [] } = useBudgets();

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = new Set(financialValues.map((fv) => fv.year));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [financialValues, currentYear]);

  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));
  const selectedYear = yearFilter === ALL_YEARS ? null : Number(yearFilter);

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    financialValue: FinancialValue | null;
  }>({ open: false, financialValue: null });

  const handleCreateClick = () => {
    setFormDialog({ open: true, financialValue: null });
  };

  const handleEditClick = (financialValue: FinancialValue) => {
    setFormDialog({ open: true, financialValue });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, financialValue: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Valori finanziari
          </h1>
          <p className="text-muted-foreground mt-2">Ricavi e costi per contratto, con l&apos;andamento rispetto al budget</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="year-filter" className="text-sm text-muted-foreground">Anno:</label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger id="year-filter" aria-label="Filtra per anno" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_YEARS}>Tutti gli anni</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreateClick} disabled={hasMissingPrerequisite}>
            + Nuovo valore finanziario
          </Button>
        </div>
      </div>

      {hasMissingPrerequisite && (
        <MissingPrerequisiteBanner message={prerequisiteMessage} actions={prerequisiteActions} />
      )}

      <FinancialValueSummary
        financialValues={financialValues}
        budgets={budgets}
        year={selectedYear}
        isAdmin={isAdmin}
      />

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Movimenti {selectedYear ?? "(tutti gli anni)"}
        </h2>
        <FinancialValueTable onEditClick={handleEditClick} year={selectedYear} />
      </div>

      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.financialValue
                ? "Modifica valore finanziario"
                : "Crea nuovo valore finanziario"}
            </DialogTitle>
          </DialogHeader>
          <FinancialValueForm
            financialValue={formDialog.financialValue}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
