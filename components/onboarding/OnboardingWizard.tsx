"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Building2, Users, PartyPopper, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUpsertBusinessArea } from "@/hooks/useUpsertBusinessArea";
import { useUpsertManager } from "@/hooks/useUpsertManager";
import {
  businessAreaSchema,
  type BusinessAreaFormData,
} from "@/lib/validations/businessArea.schema";
import { managerSchema, type ManagerFormData } from "@/lib/validations/manager.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const STEPS = [
  { id: 0, label: "Benvenuto" },
  { id: 1, label: "Area" },
  { id: 2, label: "Responsabile" },
  { id: 3, label: "Pronto!" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [currentStep, setCurrentStep] = useState(0);

  const dismissWizard = () => {
    if (user?.id) {
      localStorage.setItem(`bcm-setup-skip-${user.id}`, "1");
    }
    router.push("/dashboard");
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurazione iniziale</h1>
          <p className="text-muted-foreground mt-1">
            Pochi passi per iniziare a gestire i tuoi contratti
          </p>
        </div>
        {currentStep < 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissWizard}
            className="text-muted-foreground shrink-0"
          >
            Salta configurazione
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <nav aria-label="Progresso configurazione">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  aria-current={index === currentStep ? "step" : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    index < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : index === currentStep
                      ? "border-primary text-primary bg-background"
                      : "border-border text-muted-foreground bg-background"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                    index < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {currentStep === 0 && <WelcomeStep onNext={goNext} />}
      {currentStep === 1 && (
        <BusinessAreaStep onNext={goNext} onBack={goBack} onSkip={goNext} />
      )}
      {currentStep === 2 && (
        <ManagerStep onNext={goNext} onBack={goBack} onSkip={goNext} />
      )}
      {currentStep === 3 && <DoneStep />}
    </div>
  );
}

// ── Step 0: Welcome ────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { readonly onNext: () => void }) {
  return (
    <Card className="p-8 text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <LayoutDashboard className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Benvenuto in BCM!</h2>
        <p className="text-muted-foreground">
          Prima di iniziare, creiamo insieme le fondamenta della tua organizzazione:
          un&apos;area di business e il primo responsabile contratti.
        </p>
      </div>
      <ul className="text-left space-y-3 text-sm text-muted-foreground max-w-sm mx-auto">
        <li className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            Un&apos;{" "}
            <strong className="text-foreground">area di business</strong> per raggruppare i
            contratti
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            Un <strong className="text-foreground">responsabile</strong> a cui assegnare i
            contratti e inviare le notifiche
          </span>
        </li>
      </ul>
      <Button onClick={onNext} className="w-full sm:w-auto">
        Inizia la configurazione
      </Button>
    </Card>
  );
}

// ── Step 1: Business Area ──────────────────────────────────────────────────────

function BusinessAreaStep({
  onNext,
  onBack,
  onSkip,
}: {
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly onSkip: () => void;
}) {
  const upsert = useUpsertBusinessArea();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessAreaFormData>({
    resolver: zodResolver(businessAreaSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (data: BusinessAreaFormData) => {
    await upsert.mutateAsync({ payload: data });
    toast.success("Area di business creata!");
    onNext();
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold">Crea un&apos;area di business</h2>
          <p className="text-sm text-muted-foreground">
            Le aree raggruppano i contratti per settore o dipartimento
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="ba-name" className="block text-sm font-medium mb-1.5">
            Nome <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <Input
            id="ba-name"
            {...register("name")}
            placeholder="es. Reparto IT, Commerciale, Operations…"
            aria-describedby={errors.name ? "ba-name-error" : undefined}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p id="ba-name-error" className="text-destructive text-sm mt-1" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ba-description" className="block text-sm font-medium mb-1.5">
            Descrizione <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <Textarea
            id="ba-description"
            {...register("description")}
            placeholder="Descrivi brevemente questa area…"
            rows={3}
            aria-describedby={errors.description ? "ba-desc-error" : undefined}
            className={errors.description ? "border-destructive" : ""}
          />
          {errors.description && (
            <p id="ba-desc-error" className="text-destructive text-sm mt-1" role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Indietro
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onSkip}>
              Salta
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creazione…" : "Crea e continua"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

// ── Step 2: Manager ────────────────────────────────────────────────────────────

function ManagerStep({
  onNext,
  onBack,
  onSkip,
}: {
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly onSkip: () => void;
}) {
  const upsert = useUpsertManager();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      department: "",
    },
  });

  const onSubmit = async (data: ManagerFormData) => {
    await upsert.mutateAsync({ mode: "create", payload: data });
    toast.success("Responsabile creato!");
    onNext();
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold">Aggiungi il primo responsabile</h2>
          <p className="text-sm text-muted-foreground">
            Il responsabile viene assegnato ai contratti e riceve le notifiche di scadenza
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="m-firstName" className="block text-sm font-medium mb-1.5">
              Nome <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="m-firstName"
              {...register("firstName")}
              placeholder="Marco"
              aria-describedby={errors.firstName ? "m-firstName-error" : undefined}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p id="m-firstName-error" className="text-destructive text-sm mt-1" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="m-lastName" className="block text-sm font-medium mb-1.5">
              Cognome <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="m-lastName"
              {...register("lastName")}
              placeholder="Rossi"
              aria-describedby={errors.lastName ? "m-lastName-error" : undefined}
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && (
              <p id="m-lastName-error" className="text-destructive text-sm mt-1" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="m-email" className="block text-sm font-medium mb-1.5">
            Email <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <Input
            id="m-email"
            type="email"
            {...register("email")}
            placeholder="marco.rossi@azienda.com"
            aria-describedby={errors.email ? "m-email-error" : undefined}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p id="m-email-error" className="text-destructive text-sm mt-1" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="m-phone" className="block text-sm font-medium mb-1.5">
              Telefono <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="m-phone"
              {...register("phoneNumber")}
              placeholder="+39 02 1234567"
              aria-describedby={errors.phoneNumber ? "m-phone-error" : undefined}
              className={errors.phoneNumber ? "border-destructive" : ""}
            />
            {errors.phoneNumber && (
              <p id="m-phone-error" className="text-destructive text-sm mt-1" role="alert">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="m-dept" className="block text-sm font-medium mb-1.5">
              Dipartimento <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <Input
              id="m-dept"
              {...register("department")}
              placeholder="Acquisti"
              aria-describedby={errors.department ? "m-dept-error" : undefined}
              className={errors.department ? "border-destructive" : ""}
            />
            {errors.department && (
              <p id="m-dept-error" className="text-destructive text-sm mt-1" role="alert">
                {errors.department.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Indietro
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onSkip}>
              Salta
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creazione…" : "Crea e continua"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

// ── Step 3: Done ───────────────────────────────────────────────────────────────

function DoneStep() {
  const router = useRouter();

  return (
    <Card className="p-8 text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Tutto pronto!</h2>
        <p className="text-muted-foreground">
          La tua organizzazione è configurata. Puoi ora creare il tuo primo contratto.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Vai alla dashboard
        </Button>
        <Button onClick={() => router.push("/contracts")}>
          Crea primo contratto
        </Button>
      </div>
    </Card>
  );
}
