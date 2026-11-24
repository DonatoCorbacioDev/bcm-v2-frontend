import { clearReauth, requestReauth, useReauthStore } from '@/lib/reauth';

describe('lib/reauth', () => {
  beforeEach(() => {
    clearReauth();
    useReauthStore.setState({ open: false, resolve: null, reject: null });
  });

  it('opens the dialog and resolves with the token it confirms', async () => {
    const pending = requestReauth();
    expect(useReauthStore.getState().open).toBe(true);

    useReauthStore.getState().confirmed('reauth-one');

    await expect(pending).resolves.toBe('reauth-one');
    expect(useReauthStore.getState().open).toBe(false);
  });

  it('reuses a fresh token without asking again', async () => {
    const first = requestReauth();
    useReauthStore.getState().confirmed('reauth-one');
    await first;

    await expect(requestReauth()).resolves.toBe('reauth-one');
    expect(useReauthStore.getState().open).toBe(false);
  });

  it('two requests asking at once get the same answer from one dialog', async () => {
    const a = requestReauth();
    const b = requestReauth();
    useReauthStore.getState().confirmed('reauth-shared');

    await expect(Promise.all([a, b])).resolves.toEqual(['reauth-shared', 'reauth-shared']);
  });

  it('a closed dialog rejects, and nothing is kept', async () => {
    const pending = requestReauth();
    useReauthStore.getState().cancelled();

    await expect(pending).rejects.toThrow('Operazione annullata');
    expect(useReauthStore.getState().token).toBeNull();
  });

  it('a token past its lifetime is asked for again', async () => {
    const first = requestReauth();
    useReauthStore.getState().confirmed('reauth-old');
    await first;
    useReauthStore.setState({ expiresAt: Date.now() - 1 });

    const again = requestReauth();
    expect(useReauthStore.getState().open).toBe(true);
    useReauthStore.getState().cancelled();
    await expect(again).rejects.toThrow('Operazione annullata');
  });
});
