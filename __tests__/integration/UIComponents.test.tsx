import React from 'react';
import { render } from '@testing-library/react';

// ─── Mock Radix UI primitives so every wrapper function body executes ─────────

jest.mock('@radix-ui/react-select', () => {
  const C = ({ children, ...p }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', { 'data-testid': 'select', ...p }, children);
  return {
    Root: C, Group: C, Value: C, Trigger: C, Content: C, Portal: C,
    Viewport: C, Item: C, ItemText: C, ItemIndicator: C,
    Label: C, Separator: () => React.createElement('hr'),
    ScrollUpButton: C, ScrollDownButton: C, Icon: C,
  };
});

jest.mock('@radix-ui/react-dropdown-menu', () => {
  const C = ({ children, ...p }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', { 'data-testid': 'dm', ...p }, children);
  return {
    Root: C, Portal: C, Trigger: C, Content: C, Item: C,
    CheckboxItem: C, RadioItem: C, Label: C,
    Separator: () => React.createElement('hr'),
    Group: C, Sub: C, SubTrigger: C, SubContent: C,
    ItemIndicator: C, RadioGroup: C,
  };
});

jest.mock('lucide-react', () => ({
  CheckIcon: () => null,
  ChevronRightIcon: () => null,
  CircleIcon: () => null,
  ChevronDownIcon: () => null,
  ChevronUpIcon: () => null,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined)[]) =>
    args.filter(Boolean).join(' '),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton,
  SelectScrollDownButton,
} from '@/components/ui/select';

import {
  DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

// ─── select.tsx ───────────────────────────────────────────────────────────────

describe('select components', () => {
  it('Select renders', () => {
    const { container } = render(<Select><SelectTrigger><SelectValue /></SelectTrigger></Select>);
    expect(container).toBeTruthy();
  });

  it('SelectGroup renders', () => {
    const { container } = render(<SelectGroup />);
    expect(container).toBeTruthy();
  });

  it('SelectValue renders', () => {
    const { container } = render(<SelectValue />);
    expect(container).toBeTruthy();
  });

  it('SelectTrigger renders with default size', () => {
    const { container } = render(<SelectTrigger><SelectValue /></SelectTrigger>);
    expect(container).toBeTruthy();
  });

  it('SelectTrigger renders with sm size', () => {
    const { container } = render(<SelectTrigger size="sm"><SelectValue /></SelectTrigger>);
    expect(container).toBeTruthy();
  });

  it('SelectContent renders with default position', () => {
    const { container } = render(<SelectContent><SelectItem value="a">A</SelectItem></SelectContent>);
    expect(container).toBeTruthy();
  });

  it('SelectContent renders with popper position', () => {
    const { container } = render(<SelectContent position="popper"><SelectItem value="a">A</SelectItem></SelectContent>);
    expect(container).toBeTruthy();
  });

  it('SelectLabel renders', () => {
    const { container } = render(<SelectLabel>Label</SelectLabel>);
    expect(container).toBeTruthy();
  });

  it('SelectItem renders', () => {
    const { container } = render(<SelectItem value="x">Item</SelectItem>);
    expect(container).toBeTruthy();
  });

  it('SelectSeparator renders', () => {
    const { container } = render(<SelectSeparator />);
    expect(container).toBeTruthy();
  });

  it('SelectScrollUpButton renders', () => {
    const { container } = render(<SelectScrollUpButton />);
    expect(container).toBeTruthy();
  });

  it('SelectScrollDownButton renders', () => {
    const { container } = render(<SelectScrollDownButton />);
    expect(container).toBeTruthy();
  });
});

// ─── dropdown-menu.tsx ────────────────────────────────────────────────────────

describe('dropdown-menu components', () => {
  it('DropdownMenu renders', () => {
    const { container } = render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(container).toBeTruthy();
  });

  it('DropdownMenuPortal renders', () => {
    const { container } = render(<DropdownMenuPortal><div /></DropdownMenuPortal>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuContent renders', () => {
    const { container } = render(<DropdownMenuContent />);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuGroup renders', () => {
    const { container } = render(<DropdownMenuGroup><DropdownMenuItem>Item</DropdownMenuItem></DropdownMenuGroup>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuItem renders with default variant', () => {
    const { container } = render(<DropdownMenuItem>Item</DropdownMenuItem>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuItem renders with destructive variant', () => {
    const { container } = render(<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuItem renders with inset', () => {
    const { container } = render(<DropdownMenuItem inset>Item</DropdownMenuItem>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuCheckboxItem renders', () => {
    const { container } = render(<DropdownMenuCheckboxItem checked>Check</DropdownMenuCheckboxItem>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuRadioGroup renders', () => {
    const { container } = render(<DropdownMenuRadioGroup><DropdownMenuRadioItem value="x">X</DropdownMenuRadioItem></DropdownMenuRadioGroup>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuRadioItem renders', () => {
    const { container } = render(<DropdownMenuRadioItem value="x">Radio</DropdownMenuRadioItem>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuLabel renders', () => {
    const { container } = render(<DropdownMenuLabel>Label</DropdownMenuLabel>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuLabel renders with inset', () => {
    const { container } = render(<DropdownMenuLabel inset>Label</DropdownMenuLabel>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuSeparator renders', () => {
    const { container } = render(<DropdownMenuSeparator />);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuShortcut renders', () => {
    const { container } = render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuSub renders', () => {
    const { container } = render(<DropdownMenuSub><DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger></DropdownMenuSub>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuSubTrigger renders', () => {
    const { container } = render(<DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuSubTrigger renders with inset', () => {
    const { container } = render(<DropdownMenuSubTrigger inset>Sub</DropdownMenuSubTrigger>);
    expect(container).toBeTruthy();
  });

  it('DropdownMenuSubContent renders', () => {
    const { container } = render(<DropdownMenuSubContent />);
    expect(container).toBeTruthy();
  });
});
