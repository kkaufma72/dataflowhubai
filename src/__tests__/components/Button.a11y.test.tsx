import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { axe } from 'jest-axe';
import Button from '../../components/common/Button';

describe('Button accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not have any accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations when disabled', async () => {
    const { container } = render(<Button disabled>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with icon', async () => {
    const TestIcon = () => <svg aria-hidden="true" data-testid="test-icon" />;
    const { container } = render(
      <Button icon={<TestIcon />}>Click me</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with loading state', async () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with aria-label', async () => {
    const { container } = render(
      <Button aria-label="Close dialog">X</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});