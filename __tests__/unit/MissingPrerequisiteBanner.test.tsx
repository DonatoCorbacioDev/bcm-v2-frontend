import { render, screen } from '@testing-library/react';
import { MissingPrerequisiteBanner } from '@/components/shared/MissingPrerequisiteBanner';

describe('MissingPrerequisiteBanner', () => {
  it('renders the message and a link for each action', () => {
    render(
      <MissingPrerequisiteBanner
        message="Per creare un budget serve prima un'area di business."
        actions={[{ label: "Crea un'area di business", href: '/business-areas' }]}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Per creare un budget serve prima un'area di business."
    );
    const link = screen.getByRole('link', { name: "Crea un'area di business" });
    expect(link).toHaveAttribute('href', '/business-areas');
  });

  it('renders multiple actions when several prerequisites are missing', () => {
    render(
      <MissingPrerequisiteBanner
        message="Per creare un contratto serve prima un'area di business e un responsabile."
        actions={[
          { label: "Crea un'area di business", href: '/business-areas' },
          { label: 'Crea un responsabile', href: '/managers' },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: "Crea un'area di business" })).toHaveAttribute(
      'href',
      '/business-areas'
    );
    expect(screen.getByRole('link', { name: 'Crea un responsabile' })).toHaveAttribute(
      'href',
      '/managers'
    );
  });

  it('renders only the message when there are no actions to take (non-admin viewer)', () => {
    render(
      <MissingPrerequisiteBanner
        message="Per creare un contratto serve prima un'area di business. Contatta un amministratore."
        actions={[]}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Contatta un amministratore');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
