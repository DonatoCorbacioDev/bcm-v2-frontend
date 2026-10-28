import React from 'react';
import { render, screen } from '@testing-library/react';
import TerminiPage from '@/app/termini/page';
import { ONEROUS_CLAUSES, TERMS_VERSION } from '@/lib/legal';

/** "5 (rinnovo automatico, ...), 9 (...)" -> [["5", "rinnovo automatico, ..."], ...] */
function onerousClauses(): Array<[string, string]> {
  return [...ONEROUS_CLAUSES.matchAll(/(\d+) \(([^)]+)\)/g)].map((m) => [m[1], m[2]]);
}

describe('TerminiPage', () => {
  it('shows the published version', () => {
    render(<TerminiPage />);

    expect(screen.getByText(new RegExp(`versione ${TERMS_VERSION}`))).toBeInTheDocument();
  });

  // The approval names clauses by number: if a section is added or moved and
  // ONEROUS_CLAUSES isn't updated, customers would approve the wrong clauses.
  it.each(onerousClauses())(
    'onerous clause %s points at the section it describes (%s)',
    (number, description) => {
      render(<TerminiPage />);

      const heading = screen.getByRole('heading', { level: 2, name: new RegExp(`^${number}\\. `) });
      const firstWord = description.split(/[ ,]/)[0];
      const section = heading.closest('section');
      expect(section?.textContent?.toLowerCase()).toContain(firstWord.toLowerCase());
    },
  );

  it('lists six onerous clauses', () => {
    expect(onerousClauses().map(([n]) => n)).toEqual(['5', '9', '11', '12', '14', '16']);
  });

  it('includes the Data Act switching section with its mandatory periods', () => {
    render(<TerminiPage />);

    const section = screen
      .getByRole('heading', { level: 2, name: /Cambio di fornitore e portabilità dei dati/ })
      .closest('section');
    const text = section?.textContent ?? '';
    expect(text).toContain('2023/2854');
    expect(text).toMatch(/entro 30 giorni dalla richiesta/);
    expect(text).toMatch(/almeno 30 giorni per recuperare/);
    expect(text).toMatch(/due mesi/);
    expect(text).toMatch(/gratuiti/);
  });
});
