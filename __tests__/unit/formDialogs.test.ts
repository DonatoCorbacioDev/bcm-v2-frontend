import fs from 'node:fs';
import path from 'node:path';

/**
 * A dialog the user types into must not close on a backdrop click: it threw
 * away a half-typed form (found on the organization deletion dialog, then on
 * seven more). Confirmation and read-only dialogs may close that way, it
 * just means "cancel". This reads the source, so a new form dialog without
 * the guard fails here instead of in front of a user.
 */
const ROOTS = ['app', 'components'];
const FORM_FIELD = /<(Input|Textarea|Select|form)\b|<[A-Z]\w*Form\b|type="file"/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });
}

/** Every <DialogContent ...>...</DialogContent> block, with where it starts. */
function dialogBlocks(file: string) {
  const source = fs.readFileSync(file, 'utf8');
  const blocks: { line: number; openingTag: string; body: string }[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf('<DialogContent', from);
    if (start === -1) break;
    const end = source.indexOf('</DialogContent>', start);
    const tagEnd = source.indexOf('>', start);
    blocks.push({
      line: source.slice(0, start).split('\n').length,
      openingTag: source.slice(start, tagEnd + 1),
      body: source.slice(tagEnd + 1, end),
    });
    from = end;
  }
  return blocks;
}

describe('form dialogs', () => {
  const all = ROOTS.flatMap((root) => sourceFiles(path.join(process.cwd(), root)))
    .flatMap((file) => dialogBlocks(file).map((block) => ({ ...block, file: path.relative(process.cwd(), file) })));

  it('finds the dialogs it checks', () => {
    expect(all.length).toBeGreaterThan(20);
    expect(all.filter((d) => FORM_FIELD.test(d.body)).length).toBeGreaterThan(10);
  });

  it('never close a dialog with form fields on an outside click', () => {
    const unguarded = all
      .filter((d) => FORM_FIELD.test(d.body) && !d.openingTag.includes('onInteractOutside'))
      .map((d) => `${d.file}:${d.line}`);

    expect(unguarded).toEqual([]);
  });
});
