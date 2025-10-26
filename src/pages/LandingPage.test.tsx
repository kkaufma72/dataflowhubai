import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage', () => {
  it('renders the landing page content', () => {
    render(<LandingPage />);
    
    // Check for the main heading
    expect(screen.getByRole('heading', { name: /hello from landing page!/i })).toBeInTheDocument();
    
    // Check for the paragraph text
    expect(screen.getByText(/if you see this, the routing is working./i)).toBeInTheDocument();
  });
});
