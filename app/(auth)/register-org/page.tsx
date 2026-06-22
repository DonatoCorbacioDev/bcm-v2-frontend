"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RegisterOrgRequest {
  organizationName: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
}

interface AuthTokenResponse {
  token: string;
}

interface UserProfile {
  id: number;
  username: string;
  managerId: number;
  role: string;
  roleId: number;
  verified: boolean;
  createdAt: string;
}

export default function RegisterOrgPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RegisterOrgRequest>({
    organizationName: "",
    adminUsername: "",
    adminPassword: "",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<AuthTokenResponse>("/organizations/register", form);
      const { token } = data;

      const { data: userProfile } = await api.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuth(userProfile, token);
      router.push("/dashboard");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }> & { userMessage?: string };
      const message =
        axiosError.userMessage ||
        axiosError.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Register Organization
        </CardTitle>
        <CardDescription className="text-center">
          Create your organization and admin account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="Acme Corp"
              value={form.organizationName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">First Name</Label>
              <Input
                id="adminFirstName"
                name="adminFirstName"
                type="text"
                placeholder="Mario"
                value={form.adminFirstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminLastName">Last Name</Label>
              <Input
                id="adminLastName"
                name="adminLastName"
                type="text"
                placeholder="Rossi"
                value={form.adminLastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="admin@acme.com"
              value={form.adminEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminUsername">Username</Label>
            <Input
              id="adminUsername"
              name="adminUsername"
              type="text"
              placeholder="admin"
              value={form.adminUsername}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password</Label>
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              placeholder="••••••••"
              value={form.adminPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div role="alert" className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating organization..." : "Create Organization"}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-500">Already have an account? </span>
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
