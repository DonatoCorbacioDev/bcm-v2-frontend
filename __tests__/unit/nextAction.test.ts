import { nextAction } from '@/components/contracts/NextActionCard';
import type { Contract } from '@/types';

const base: Contract = {
  id: 1, counterpartyId: 1, contractNumber: 'MAN-1', wbsCode: '', projectName: 'Manutenzione impianti',
  areaId: 1, managerId: 1, managerName: 'Marco Bellini', startDate: '2025-12-31', endDate: '2026-12-31',
  status: 'ACTIVE', createdAt: '2025-12-01',
};

describe('nextAction: what to do about a contract now', () => {
  it('asks to give notice by the deadline of a tacit renewal, saying what happens otherwise', () => {
    const action = nextAction({ ...base, autoRenew: true, noticeDays: 90, renewalMonths: 12,
      noticeDeadline: '2026-10-02', daysUntilNoticeDeadline: 20, daysUntilExpiry: 110 });

    expect(action.title).toBe('Disdici entro il 2 ottobre 2026 (tra 20 giorni) se non vuoi rinnovarlo');
    expect(action.detail).toBe('Dopo questa data si rinnova per altri 12 mesi.');
    expect(action.tone).toBe('warning');
  });

  it('says the deadline has passed and the contract will renew', () => {
    const action = nextAction({ ...base, autoRenew: true, noticeDays: 90, renewalMonths: 12,
      noticeDeadline: '2026-10-02', daysUntilNoticeDeadline: -5, daysUntilExpiry: 85 });

    expect(action.title).toBe('Termine di disdetta passato: il 31 dicembre 2026 si rinnova per altri 12 mesi');
  });

  it('reassures when the notice deadline is still far', () => {
    const action = nextAction({ ...base, autoRenew: true, noticeDays: 30, renewalMonths: 12,
      noticeDeadline: '2026-12-01', daysUntilNoticeDeadline: 200 });

    expect(action.title).toBe('Nessuna azione nei prossimi 30 giorni');
    expect(action.detail).toBe('Ultimo giorno per disdire: 1 dicembre 2026.');
    expect(action.tone).toBe('ok');
  });

  it('asks to complete a tacit renewal without notice or length', () => {
    expect(nextAction({ ...base, autoRenew: true }).title).toBe('Verifica il rinnovo');
  });

  it('warns about an ordinary contract ending within 30 days', () => {
    expect(nextAction({ ...base, daysUntilExpiry: 1 }).title).toBe('Scade il 31 dicembre 2026 (domani)');
    expect(nextAction({ ...base, daysUntilExpiry: 0 }).title).toBe('Scade il 31 dicembre 2026 (oggi)');
  });

  it('reassures about an ordinary contract ending later', () => {
    const action = nextAction({ ...base, daysUntilExpiry: 120 });

    expect(action.title).toBe('Nessuna scadenza nei prossimi 30 giorni');
    expect(action.detail).toBe('Scade il 31 dicembre 2026.');
  });

  it('describes contracts that are not active', () => {
    expect(nextAction({ ...base, status: 'EXPIRED' }).title).toBe('Scaduto il 31 dicembre 2026');
    expect(nextAction({ ...base, status: 'DRAFT' }).title).toBe('Bozza: non ancora attiva');
    expect(nextAction({ ...base, status: 'CANCELLED' }).title).toBe('Contratto annullato');
  });
});
