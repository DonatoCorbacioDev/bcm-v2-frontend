import { cancellationLetter } from '@/lib/cancellationLetter';
import type { Contract } from '@/types';

const contract = {
  id: 'c1', counterpartyId: 's1', counterparty: { name: 'Gestio Software S.r.l.' },
  contractNumber: 'NRT-123', projectName: 'Licenza software gestionale', endDate: '2026-12-31',
  autoRenew: true, noticeDays: 30, renewalMonths: 12,
} as unknown as Contract;

describe('cancellationLetter', () => {
  it('fills sender, supplier, contract, end date and notice', () => {
    const { subject, body } = cancellationLetter(contract, 'Nortiva Solutions S.r.l.');

    expect(subject).toBe('Disdetta del contratto NRT-123 - Licenza software gestionale');
    expect(body).toContain('Spett.le Gestio Software S.r.l.,');
    expect(body).toContain('Nortiva Solutions S.r.l. comunica la disdetta del contratto n. NRT-123 "Licenza software gestionale", in scadenza il 31 dicembre 2026');
    expect(body).toContain('preavviso di 30 giorni previsto dal contratto');
    expect(body).toContain('confermare per iscritto la ricezione');
  });

  it('leaves visible blanks for what BCM does not know, never an invented value', () => {
    const { body } = cancellationLetter({ ...contract, noticeDays: null, counterparty: undefined } as unknown as Contract, null);

    expect(body).toContain('Spett.le [fornitore],');
    expect(body).toContain('[ragione sociale della tua azienda] comunica');
    expect(body).toContain('nel rispetto del preavviso previsto dal contratto.');
    expect(body).toContain('[nome, cognome e ruolo di chi firma]');
  });
});
