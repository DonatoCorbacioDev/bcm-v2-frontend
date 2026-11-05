import { dayWithArticle } from '@/lib/italianDate';

describe('dayWithArticle', () => {
  it('uses "il" for most days', () => {
    expect(dayWithArticle('2026-11-24')).toBe('il 24 novembre');
    expect(dayWithArticle('2026-12-31', true)).toBe('il 31 dicembre 2026');
  });

  it("elides the article before 8 and 11: l'8, l'11", () => {
    expect(dayWithArticle('2026-11-11')).toBe("l'11 novembre");
    expect(dayWithArticle('2026-03-08', true)).toBe("l'8 marzo 2026");
  });

  it('writes the first of the month as an ordinal', () => {
    expect(dayWithArticle('2026-06-01')).toBe('il 1° giugno');
  });
});
