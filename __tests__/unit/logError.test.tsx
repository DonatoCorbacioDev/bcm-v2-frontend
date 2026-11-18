import { render, screen, fireEvent } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { logError } from '@/lib/logError';
import ErrorPage from '@/app/error';
import GlobalError from '@/app/global-error';
import NotFound from '@/app/not-found';

// A plain fake: a value shaped like a real JWT trips the secret scanner.
const TOKEN = 'test-access-token';

/** A failed request the way axios hands it over: with the request it came from. */
const failedRequest = (status: number, data: unknown) => {
  const config = {
    headers: new AxiosHeaders({ Authorization: `Bearer ${TOKEN}` }),
    data: JSON.stringify({ username: 'mario', password: 'Segreta#2026' }),
  };
  return new AxiosError('Request failed', String(status), config, undefined, {
    status, statusText: '', headers: {}, config, data,
  });
};

describe('logError', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  const logged = () => consoleError.mock.calls.flat().map(String).join(' ');

  it('logs status and the backend message, never the token or the request body', () => {
    logError('Upsert error:', failedRequest(400, { message: 'Username già esistente.' }));

    expect(consoleError).toHaveBeenCalledWith('Upsert error:', '400: Username già esistente.');
    expect(logged()).not.toContain(TOKEN);
    expect(logged()).not.toContain('Segreta#2026');
  });

  it("falls back to axios' own message, and says when nothing answered", () => {
    logError('Save error:', failedRequest(500, '<html>'));
    expect(consoleError).toHaveBeenLastCalledWith('Save error:', '500: Request failed');

    logError('Save error:', new AxiosError('Network Error'));
    expect(consoleError).toHaveBeenLastCalledWith('Save error:', 'no response: Network Error');
  });

  it('logs the message of any other error, or the value itself', () => {
    logError('Page error:', new Error('boom'));
    expect(consoleError).toHaveBeenLastCalledWith('Page error:', 'boom');

    logError('Page error:', 'thrown string');
    expect(consoleError).toHaveBeenLastCalledWith('Page error:', 'thrown string');
  });
});

describe('error pages', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it('the page error says what happened in Italian, never the error, and retries', () => {
    const retry = jest.fn();
    render(<ErrorPage error={new Error('SELECT * FROM users failed at Foo.java:42')} retry={retry} />);

    expect(screen.getByRole('heading', { name: 'Qualcosa è andato storto' })).toBeInTheDocument();
    expect(screen.queryByText(/Foo\.java|SELECT/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vai alla dashboard' })).toHaveAttribute('href', '/dashboard');

    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('the global error renders on its own, without the error, and retries', () => {
    const retry = jest.fn();
    // It renders its own <html>; React's nesting warning inside a test div is muted above.
    render(<GlobalError error={new Error('stack at Layout.tsx:10')} retry={retry} />);

    expect(screen.getByRole('heading', { name: 'Qualcosa è andato storto' })).toBeInTheDocument();
    expect(screen.queryByText(/Layout\.tsx/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('the not-found page says so and leads back to the dashboard', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Pagina non trovata' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vai alla dashboard' })).toHaveAttribute('href', '/dashboard');
  });
});
