import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import Card from '../../components/common/Card';

describe('Card accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with title and description', async () => {
    const { container } = render(
      <Card title="Card Title" description="Card description">
        <p>Card content</p>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with footer', async () => {
    const { container } = render(
      <Card 
        title="Card Title" 
        footer={<button>Action</button>}
      >
        <p>Card content</p>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with custom role', async () => {
    const { container } = render(
      <Card role="article">
        <p>Card content</p>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});