import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  afterEach(() => {
    // @ts-expect-error - jsdom doesn't implement showPicker; keep tests isolated from each other.
    delete HTMLInputElement.prototype.showPicker;
  });

  it.each(['date', 'datetime-local', 'month', 'time'] as const)(
    'opens the native picker on click for type="%s" when the browser supports it',
    async (type) => {
      const showPicker = jest.fn();
      HTMLInputElement.prototype.showPicker = showPicker;
      render(<Input type={type} aria-label="field" />);

      await userEvent.click(screen.getByLabelText('field'));

      expect(showPicker).toHaveBeenCalledTimes(1);
    }
  );

  it('does not throw when the browser has no showPicker support', async () => {
    render(<Input type="date" aria-label="field" />);

    await expect(userEvent.click(screen.getByLabelText('field'))).resolves.not.toThrow();
  });

  it('does not attempt to open a picker for a non-date input type', async () => {
    const showPicker = jest.fn();
    HTMLInputElement.prototype.showPicker = showPicker;
    render(<Input type="text" aria-label="field" />);

    await userEvent.click(screen.getByLabelText('field'));

    expect(showPicker).not.toHaveBeenCalled();
  });

  it('still forwards the click to a caller-provided onClick handler', async () => {
    const showPicker = jest.fn();
    HTMLInputElement.prototype.showPicker = showPicker;
    const onClick = jest.fn();
    render(<Input type="date" aria-label="field" onClick={onClick} />);

    await userEvent.click(screen.getByLabelText('field'));

    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without an onClick handler', async () => {
    render(<Input type="text" aria-label="field" />);

    await expect(userEvent.click(screen.getByLabelText('field'))).resolves.not.toThrow();
  });
});
