import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { NoticeCalculator } from '@/components/notice-calculator/NoticeCalculator';

/**
 * The public calculator, end to end in the component: what the visitor types,
 * what it answers. The arithmetic itself is covered in noticeDeadline.test.ts.
 */
describe('NoticeCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-25T10:00:00'));
  });
  afterEach(() => jest.useRealTimers());

  const fill = (label: string | RegExp, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('asks for the terms before answering', () => {
    render(<NoticeCalculator />);

    expect(screen.getByText(/qui compare l'ultimo giorno per disdire/)).toBeInTheDocument();
  });

  it('gives the last day and the days left, and says it must arrive, not leave', () => {
    render(<NoticeCalculator />);
    fill('Scadenza del contratto', '2027-03-15');
    fill('Preavviso scritto nel contratto', '90');

    expect(screen.getByText(/15 dicembre 2026/)).toBeInTheDocument();
    expect(screen.getByText('tra 20 giorni')).toBeInTheDocument();
    expect(screen.getByText('arrivare')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prova la demo' })).toHaveAttribute('href', '/demo');
  });

  it('warns when the last day is a Saturday or a Sunday', () => {
    render(<NoticeCalculator />);
    fill('Scadenza del contratto', '2027-01-05');
    fill('Preavviso scritto nel contratto', '30');

    expect(screen.getByText(/Cade di sabato o domenica/)).toBeInTheDocument();
  });

  it('a passed deadline asks for the renewal, then gives the next one', () => {
    render(<NoticeCalculator />);
    fill('Scadenza del contratto', '2026-12-01');
    fill('Preavviso scritto nel contratto', '60');

    expect(screen.getByText('Termine passato')).toBeInTheDocument();

    fill(/per quanti mesi/, '12');

    expect(screen.getByText(/si è rinnovato/)).toBeInTheDocument();
    expect(screen.getByText(/2 ottobre 2027/)).toBeInTheDocument();
  });

  it('explains what is wrong instead of answering', () => {
    render(<NoticeCalculator />);
    fill('Scadenza del contratto', '2027-03-15');
    fill('Preavviso scritto nel contratto', '0');

    expect(screen.getByText(/Inserisci il preavviso/)).toBeInTheDocument();
  });

  it('keeps what is typed in the browser: the form never posts', () => {
    render(<NoticeCalculator />);
    const form = screen.getByRole('form', { name: 'Calcolo della disdetta' });
    const submit = new Event('submit', { bubbles: true, cancelable: true });

    form.dispatchEvent(submit);

    expect(submit.defaultPrevented).toBe(true);
  });
});
