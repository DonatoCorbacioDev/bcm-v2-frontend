/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import type { Contract } from "@/types";

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * A neutral cancellation letter for a tacitly renewing contract, filled with
 * what BCM knows: who sends it, to whom, which contract, its end date and the
 * notice. The bracketed lines are the sender's to complete. It is a starting
 * point, not legal advice: the dialog says to follow the contract's own
 * delivery rules (PEC, registered letter).
 */
export function cancellationLetter(contract: Contract, senderName: string | null | undefined): { subject: string; body: string } {
  const sender = senderName?.trim() || "[ragione sociale della tua azienda]";
  const supplier = contract.counterparty?.name ?? "[fornitore]";
  const what = contract.projectName ? ` "${contract.projectName}"` : "";
  const subject = `Disdetta del contratto ${contract.contractNumber}${contract.projectName ? ` - ${contract.projectName}` : ""}`;

  const notice = contract.noticeDays
    ? `nel rispetto del preavviso di ${contract.noticeDays} giorni previsto dal contratto`
    : "nel rispetto del preavviso previsto dal contratto";

  const body = [
    `Spett.le ${supplier},`,
    "",
    `con la presente ${sender} comunica la disdetta del contratto n. ${contract.contractNumber}${what}, in scadenza il ${longDate(contract.endDate)}, così che alla scadenza non si rinnovi tacitamente.`,
    "",
    `La disdetta è inviata ${notice}.`,
    "",
    "Vi chiediamo di confermare per iscritto la ricezione della presente.",
    "",
    "Distinti saluti,",
    sender,
    "[nome, cognome e ruolo di chi firma]",
  ].join("\n");

  return { subject, body };
}
