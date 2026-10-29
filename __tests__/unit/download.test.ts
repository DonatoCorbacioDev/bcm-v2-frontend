import { filenameFromContentDisposition } from '@/lib/download';

describe('filenameFromContentDisposition', () => {
  it.each([
    ['attachment; filename="bcm-export-acme-2026-10-29.zip"', 'bcm-export-acme-2026-10-29.zip'],
    ['attachment; filename=report.zip', 'report.zip'],
    ['attachment; FILENAME="a.zip"; size=10', 'a.zip'],
  ])('reads the file name from %s', (header, expected) => {
    expect(filenameFromContentDisposition(header)).toBe(expected);
  });

  it.each([undefined, null, '', 'inline'])('returns null when there is no file name (%p)', (header) => {
    expect(filenameFromContentDisposition(header)).toBeNull();
  });
});
