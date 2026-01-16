"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { FinancialValue } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FinancialValueTable() {
  const [values, setValues] = useState<FinancialValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    try {
      const response = await api.get("/financial-values");
      setValues(response.data);
    } catch (error) {
      console.error("Error fetching financial values:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading financial values...</div>;
  }

  if (values.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No financial values found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first financial value to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Financial Type ID</TableHead>
            <TableHead>Business Area ID</TableHead>
            <TableHead>Contract ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {values.map((value) => (
            <TableRow key={value.id}>
              <TableCell>{value.month}</TableCell>
              <TableCell>{value.year}</TableCell>
              <TableCell className="font-medium">
                €
                {value.financialAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>{value.financialTypeId}</TableCell>
              <TableCell>{value.businessAreaId}</TableCell>
              <TableCell>{value.contractId}</TableCell>
              <TableCell>
                <button className="text-blue-600 hover:underline text-sm">
                  View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
