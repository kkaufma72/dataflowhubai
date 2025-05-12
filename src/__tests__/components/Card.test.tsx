import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from '../../components/common/Card';

describe('Card component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div data-testid="card-content">Card Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toHaveTextContent('Card Content');
  });

  it('renders title and description when provided', () => {
    render(
      <Card title="Card Title" description="Card Description">
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Card footer={<div data-testid="card-footer">Footer Content</div>}>
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByTestId('card-footer')).toHaveTextContent('Footer Content');
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-class">
        <div>Card Content</div>
      </Card>
    );
    
    const cardElement = screen.getByRole('region');
    expect(cardElement).toHaveClass('custom-class');
    expect(cardElement).toHaveClass('bg-white');
    expect(cardElement).toHaveClass('rounded-lg');
  });

  it('applies custom role when provided', () => {
    render(
      <Card role="article">
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('renders with proper ARIA attributes when title is provided', () => {
    render(
      <Card title="Accessible Title">
        <div>Card Content</div>
      </Card>
    );
    
    const titleElement = screen.getByRole('heading', { level: 3 });
    expect(titleElement).toHaveTextContent('Accessible Title');
    
    const titleId = titleElement.id;
    expect(titleId).toContain('card-title-accessible-title');
    
    // The card should have aria-labelledby pointing to the title
    const cardElement = screen.getByRole('region');
    expect(cardElement).toHaveAttribute('aria-labelledby', titleId);
  });
});