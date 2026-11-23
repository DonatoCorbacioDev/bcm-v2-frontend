import { contractStatusOptions } from '@/lib/statusConfig';

const values = (current?: string | null) => contractStatusOptions(current).map((o) => o.value).sort();

describe('contractStatusOptions', () => {
  it('offers every status for a new contract', () => {
    expect(values()).toEqual(['ACTIVE', 'CANCELLED', 'DRAFT', 'EXPIRED']);
    expect(values(null)).toEqual(['ACTIVE', 'CANCELLED', 'DRAFT', 'EXPIRED']);
  });

  it('never offers ACTIVE for a draft: only approval activates it', () => {
    expect(values('DRAFT')).toEqual(['CANCELLED', 'DRAFT']);
  });

  it('never offers DRAFT once a contract is out of it', () => {
    expect(values('ACTIVE')).toEqual(['ACTIVE', 'CANCELLED', 'EXPIRED']);
    expect(values('EXPIRED')).toEqual(['ACTIVE', 'CANCELLED', 'EXPIRED']);
  });

  it('keeps a cancelled contract cancelled', () => {
    expect(values('CANCELLED')).toEqual(['CANCELLED']);
  });

  it('labels each option in Italian', () => {
    expect(contractStatusOptions('CANCELLED')).toEqual([{ value: 'CANCELLED', label: 'Annullato' }]);
  });
});
