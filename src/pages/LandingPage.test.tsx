import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

describe('LandingPage', () => {
  it('renders the landing page content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome to dataflowhub ai/i })).toBeInTheDocument();
    expect(screen.getByText(/integrated solution for building, deploying, and monitoring/i)).toBeInTheDocument();
  });
});
