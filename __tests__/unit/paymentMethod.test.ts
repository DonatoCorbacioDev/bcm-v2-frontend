import { paymentKind, paymentMethodLabel } from '@/lib/paymentMethod';

describe('paymentMethod', () => {
  it('pays a bank transfer, or an invoice stating no method, by SEPA from BCM', () => {
    expect(paymentKind('MP05')).toBe('TRANSFER');
    expect(paymentKind(null)).toBe('TRANSFER');
    expect(paymentKind('')).toBe('TRANSFER');
  });

  it('leaves RiBa and direct debits to the supplier, the rest outside BCM', () => {
    expect(paymentKind('MP12')).toBe('COLLECTED_BY_SUPPLIER');
    expect(paymentKind('MP19')).toBe('COLLECTED_BY_SUPPLIER');
    expect(paymentKind('MP21')).toBe('COLLECTED_BY_SUPPLIER');
    expect(paymentKind('MP08')).toBe('OUTSIDE_BCM');
    expect(paymentKind('MP01')).toBe('OUTSIDE_BCM');
  });

  it('names the methods in Italian, the code for unknown ones', () => {
    expect(paymentMethodLabel('MP12')).toBe('RiBa');
    expect(paymentMethodLabel('MP08')).toBe('carta di pagamento');
    expect(paymentMethodLabel('MP17')).toBe('metodo MP17');
    expect(paymentMethodLabel(null)).toBe('non indicato');
  });
});
