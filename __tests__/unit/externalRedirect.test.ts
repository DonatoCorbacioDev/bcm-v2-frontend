import { redirectToExternal } from '@/lib/externalRedirect';

describe('redirectToExternal', () => {
  it('navigates the window via location.assign', () => {
    // jsdom implements same-document (hash) navigation, unlike a real
    // cross-origin one - enough to prove assign() is what gets called.
    redirectToExternal('#stripe-checkout');
    expect(window.location.hash).toBe('#stripe-checkout');
  });
});
