import { downloadBlob, filenameFromContentDisposition } from '@/lib/download';

describe('downloadBlob', () => {
  const createObjectURL = jest.fn(() => 'blob:fake-url');
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL });
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it('clicks a temporary link named after the file, then cleans up', () => {
    const blob = new Blob(['zip']);
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toBe('blob:fake-url');
      expect(this.download).toBe('bcm-export.zip');
      expect(document.body.contains(this)).toBe(true);
    });

    downloadBlob(blob, 'bcm-export.zip');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    click.mockRestore();
  });
});

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
