"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { PageHeader } from "@/components/layout/PageHeader";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import UserTable from "@/components/users/UserTable";
import UserForm from "@/components/users/UserForm";
import InviteUserForm from "@/components/users/InviteUserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  keepOpenOnOutsideClick,
} from "@/components/ui/dialog";
import type { User } from "@/types";

function UsersPageContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  // "Invita" in the Home's first steps links here with ?invite=1: the invite
  // form opens straight away; closing it drops the parameter.
  const searchParams = useSearchParams();
  const inviteFromLink = searchParams.get("invite") === "1";

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleEditClick = (user: User) => {
    setFormDialog({ open: true, user });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, user: null });
  };

  const closeInvite = () => {
    setInviteOpen(false);
    if (inviteFromLink) router.replace("/users");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utenti"
        description={<>Le persone che entrano in BCM con email e password. Ognuna è collegata a un{" "}
            <Link href="/managers" className="font-medium text-primary underline-offset-4 hover:underline">responsabile</Link>, la
            scheda con nome e contatti.</>}
        back={{ href: "/settings", label: "Impostazioni" }}
        actions={
          <>
            {/* One way in: the invitation, where the person chooses their own
            password. An existing user is still edited from the table. */}
        <Button onClick={() => setInviteOpen(true)}>+ Invita utente</Button>
          </>
        }
      />

      <UserTable onEditClick={handleEditClick} />

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={keepOpenOnOutsideClick}>
          <DialogHeader>
            <DialogTitle>
              {formDialog.user ? "Modifica utente" : "Crea nuovo utente"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={formDialog.user}
            onClose={handleCloseForm}
            onSuccess={() => { }}
          />
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen || inviteFromLink} onOpenChange={(open) => (open ? setInviteOpen(true) : closeInvite())}>
        <DialogContent className="max-w-md" onInteractOutside={keepOpenOnOutsideClick}>
          <DialogHeader>
            <DialogTitle>Invita utente</DialogTitle>
          </DialogHeader>
          <InviteUserForm onClose={closeInvite} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersPageContent />
    </Suspense>
  );
}
