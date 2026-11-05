import { formatAddress } from '@/lib/formatAddress';

describe('formatAddress', () => {
  it('writes an Italian address in postal order, on one line', () => {
    expect(formatAddress({ address: 'Via Roma 12', postalCode: '20121', city: 'Milano', province: 'MI', country: 'IT' }))
      .toBe('Via Roma 12, 20121 Milano (MI)');
  });

  it('adds the country only when it is not Italy', () => {
    expect(formatAddress({ address: 'Rue de Rivoli 1', postalCode: '75001', city: 'Paris', country: 'fr' }))
      .toBe('Rue de Rivoli 1, 75001 Paris, FR');
  });

  it('keeps what is known and is empty when nothing is', () => {
    expect(formatAddress({ city: 'Torino' })).toBe('Torino');
    expect(formatAddress({})).toBe('');
  });
});
