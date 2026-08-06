import { renderHook, act, waitFor } from '@testing-library/react';
import { usePasswordResetForm } from '@/hooks/usePasswordResetForm';

function fakeSubmitEvent() {
  return { preventDefault: jest.fn() } as unknown as React.SubmitEvent<HTMLFormElement>;
}

describe('usePasswordResetForm', () => {
  it('rejects a password shorter than 8 characters without calling onSubmit', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      usePasswordResetForm({ onSubmit, submitErrorMessage: 'boom' })
    );

    act(() => result.current.setPassword('short'));
    act(() => result.current.setConfirm('short'));
    await act(async () => result.current.handleSubmit(fakeSubmitEvent()));

    expect(result.current.error).toBe('La password deve contenere almeno 8 caratteri.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords without calling onSubmit', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      usePasswordResetForm({ onSubmit, submitErrorMessage: 'boom' })
    );

    act(() => result.current.setPassword('longenough1'));
    act(() => result.current.setConfirm('longenough2'));
    await act(async () => result.current.handleSubmit(fakeSubmitEvent()));

    expect(result.current.error).toBe('Le password non coincidono.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the password and clears loading on success', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePasswordResetForm({ onSubmit, submitErrorMessage: 'boom' })
    );

    act(() => result.current.setPassword('longenough1'));
    act(() => result.current.setConfirm('longenough1'));
    await act(async () => result.current.handleSubmit(fakeSubmitEvent()));

    expect(onSubmit).toHaveBeenCalledWith('longenough1');
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets the submit error message and clears loading when onSubmit rejects', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() =>
      usePasswordResetForm({ onSubmit, submitErrorMessage: 'Link non valido.' })
    );

    act(() => result.current.setPassword('longenough1'));
    act(() => result.current.setConfirm('longenough1'));
    await act(async () => result.current.handleSubmit(fakeSubmitEvent()));

    expect(result.current.error).toBe('Link non valido.');
    expect(result.current.isLoading).toBe(false);
  });

  it('is in a loading state while onSubmit is pending', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = jest.fn(() => new Promise<void>((resolve) => { resolveSubmit = resolve; }));
    const { result } = renderHook(() =>
      usePasswordResetForm({ onSubmit, submitErrorMessage: 'boom' })
    );

    act(() => result.current.setPassword('longenough1'));
    act(() => result.current.setConfirm('longenough1'));

    let submitPromise!: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit(fakeSubmitEvent());
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    resolveSubmit();
    await act(async () => submitPromise);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears a previous error when a new submit attempt starts', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePasswordResetForm({ onSubmit, submitErrorMessage: 'boom' })
    );

    act(() => result.current.setPassword('short'));
    act(() => result.current.setConfirm('short'));
    await act(async () => result.current.handleSubmit(fakeSubmitEvent()));
    expect(result.current.error).not.toBe('');

    act(() => result.current.setPassword('longenough1'));
    act(() => result.current.setConfirm('longenough1'));
    await act(async () => result.current.handleSubmit(fakeSubmitEvent()));

    expect(result.current.error).toBe('');
  });
});
