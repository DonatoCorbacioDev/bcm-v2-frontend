"use client";

import { useContracts } from "@/hooks/useContracts";
import type { Contract } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ContractTable() {
  const { data, isLoading, isError } = useContracts();
  const contracts = data ?? [];

  const getStatusBadge = (status: Contract["status"]) => {
    const variants: Record<Contract["status"], "default" | "secondary" | "destructive"> = {
      ACTIVE: "default",
      EXPIRED: "secondary",
      CANCELLED: "destructive",
    };
    return variants[status] ?? "secondary";
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading contracts...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-red-500">Failed to load contracts</p>
        <p className="text-sm text-gray-400 mt-2">Check API / network / auth token</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500">No contracts found</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first contract to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract Number</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>WBS Code</TableHead>
            <TableHead>Manager ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.contractNumber}</TableCell>
              <TableCell>{c.customerName}</TableCell>
              <TableCell>{c.projectName}</TableCell>
              <TableCell>{c.wbsCode}</TableCell>
              <TableCell>{c.managerId}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadge(c.status)}>{c.status}</Badge>
              </TableCell>
              <TableCell>{c.startDate}</TableCell>
              <TableCell>{c.endDate || "N/A"}</TableCell>
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
