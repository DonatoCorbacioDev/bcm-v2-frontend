"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_CREDENTIALS } from "@/lib/demo";

/**
 * The landing's "Prova la demo" lands here and goes straight in: no form,
 * the demo's credentials are public. If signing in fails (the nightly reset
 * running, the rate limit), it says so and offers to retry or to use the
 * login page.
 */
export default function DemoPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  const enter = async () => {
    setFailed(false);
    const result = await login(DEMO_CREDENTIALS);
    if (result.success) router.replace("/dashboard");
    else setFailed(true);
  };

  useEffect(() => {
    // Once, even when React runs effects twice in development.
    if (started.current) return;
    started.current = true;
    void enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <LogoMark size={40} className="mx-auto" />
        {failed ? (
          <>
            <h1 className="mt-5 text-xl font-semibold text-foreground">La demo non si è aperta</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Può succedere mentre i dati di esempio si azzerano, di notte, o dopo molti tentativi ravvicinati.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button type="button" onClick={() => void enter()}>Riprova</Button>
              <Button asChild variant="outline">
                <Link href="/login?demo=1">Vai all&apos;accesso</Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground" role="status">Apro la demo…</p>
        )}
      </div>
    </main>
  );
}
