import { isAllowedExternalUrl, redirectToExternal } from '@/lib/externalRedirect';

describe('redirectToExternal', () => {
  it('navigates to a Stripe page', () => {
    const navigate = jest.fn();
    redirectToExternal('https://billing.stripe.com/p/session/test_1', navigate);
    expect(navigate).toHaveBeenCalledWith('https://billing.stripe.com/p/session/test_1');
  });

  it.each([
    'javascript:alert(1)',
    'http://billing.stripe.com/p/session/test_1',
    'https://billing.stripe.com.attacker.example/p',
    'https://attacker.example/?u=https://billing.stripe.com',
    '//billing.stripe.com/p',
    'data:text/html,<script>alert(1)</script>',
    'not a url',
  ])('refuses %s and does not navigate', (url) => {
    const navigate = jest.fn();
    expect(() => redirectToExternal(url, navigate)).toThrow('Redirect refused');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('allows checkout and the billing portal only', () => {
    expect(isAllowedExternalUrl('https://checkout.stripe.com/c/pay/cs_test')).toBe(true);
    expect(isAllowedExternalUrl('https://stripe.com/')).toBe(false);
  });
});
