"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Contract } from "@/types";
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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get("/contracts");
      setContracts(response.data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ACTIVE: "default",
      EXPIRED: "secondary",
      CANCELLED: "destructive",
      DRAFT: "secondary",
    };
    return variants[status] || "secondary";
  };

  if (loading) {
    return <div className="text-center py-8">Loading contracts...</div>;
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
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">
                {contract.contractNumber}
              </TableCell>
              <TableCell>{contract.customerName}</TableCell>
              <TableCell>{contract.projectName}</TableCell>
              <TableCell>{contract.wbsCode}</TableCell>
              <TableCell>{contract.managerId}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadge(contract.status)}>
                  {contract.status}
                </Badge>
              </TableCell>
              <TableCell>{contract.startDate}</TableCell>
              <TableCell>{contract.endDate || "N/A"}</TableCell>
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
