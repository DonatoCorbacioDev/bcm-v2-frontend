"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import FinancialValueTable from "@/components/financial-values/FinancialValueTable";

export default function FinancialValuesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Values
          </h2>
          <p className="text-gray-500 mt-2">
            Track financial data across contracts
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New Financial Value</Button>
      </div>

      <FinancialValueTable />

      {showForm && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-600">Form coming soon...</p>
          <Button onClick={() => setShowForm(false)} className="mt-2">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
