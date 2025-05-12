# Testing Guide for DataFlowHub AI

This document outlines the testing procedures, requirements, and best practices for the DataFlowHub AI platform.

## Testing Overview

DataFlowHub AI uses a comprehensive testing approach that includes:

- Unit tests for individual functions and components
- Integration tests for feature interactions
- End-to-end tests for complete user flows
- Performance tests for critical operations
- Accessibility tests for UI components

## Testing Tools

- **Vitest**: Fast unit testing framework compatible with Vite
- **React Testing Library**: Component testing with a focus on user behavior
- **MSW (Mock Service Worker)**: API mocking for tests
- **Cypress**: End-to-end testing
- **Lighthouse**: Performance and accessibility testing
- **Axe**: Accessibility testing

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/components/common/Button.test.tsx
```

### End-to-End Tests

```bash
# Run Cypress tests in headless mode
npm run test:e2e

# Open Cypress test runner
npm run test:e2e:open
```

### Accessibility Tests

```bash
# Run accessibility tests
npm run test:a11y
```

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions and components in isolation. Use mocks for dependencies.

```typescript
// Example unit test for a utility function
import { describe, it, expect } from 'vitest';
import { formatNumber } from '../lib/formatting';

describe('formatNumber', () => {
  it('formats numbers with commas for thousands', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('handles decimal places correctly', () => {
    expect(formatNumber(1000.5)).toBe('1,000.5');
    expect(formatNumber(1000.55, 1)).toBe('1,000.6');
  });

  it('returns empty string for non-numeric inputs', () => {
    expect(formatNumber(NaN)).toBe('');
    expect(formatNumber(undefined as any)).toBe('');
  });
});
```

### Component Tests

Component tests should focus on user interactions and rendered output.

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../components/common/Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(<Button icon={<TestIcon />}>Click me</Button>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Tests

Integration tests should verify that multiple components work together correctly.

```typescript
// Example integration test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MLProvider } from '../context/MLContext';
import DataManagement from '../pages/DataManagement';

// Mock the context
vi.mock('../context/MLContext', () => ({
  useMLContext: () => ({
    datasets: [
      {
        id: 'test-dataset-1',
        name: 'Test Dataset',
        description: 'A test dataset',
        rows: 100,
        columns: 5,
        dateUploaded: '2023-01-01T00:00:00Z',
        fileType: 'csv',
        fileSize: '10KB',
        projectId: 'test-project'
      }
    ],
    addDataset: vi.fn(),
    isLoading: false
  }),
  MLProvider: ({ children }) => <div>{children}</div>
}));

describe('DataManagement', () => {
  it('displays datasets', () => {
    render(
      <MemoryRouter>
        <MLProvider>
          <DataManagement />
        </MLProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Test Dataset')).toBeInTheDocument();
    expect(screen.getByText('A test dataset')).toBeInTheDocument();
    expect(screen.getByText('100 rows • 5 columns')).toBeInTheDocument();
  });

  it('opens upload form when upload button is clicked', () => {
    render(
      <MemoryRouter>
        <MLProvider>
          <DataManagement />
        </MLProvider>
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText('Upload Dataset'));
    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
  });
});
```

### End-to-End Tests

End-to-end tests should verify complete user flows.

```typescript
// Example Cypress E2E test
describe('User Authentication', () => {
  it('allows a user to sign in', () => {
    cy.visit('/signin');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/app');
    cy.contains('Welcome to DataFlowHub AI').should('be.visible');
  });

  it('shows error message for invalid credentials', () => {
    cy.visit('/signin');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password').should('be.visible');
  });
});
```

## Test Coverage Requirements

- **Unit Tests**: Minimum 80% coverage for utility functions
- **Component Tests**: All common components must have tests for key functionality
- **Integration Tests**: All major features must have integration tests
- **E2E Tests**: Critical user flows must have end-to-end tests

## Mocking

### API Mocking

Use MSW to mock API responses:

```typescript
// Example API mock setup
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://api.dataflowhub.ai/v1/models', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        models: [
          {
            id: 'model-1',
            name: 'Test Model',
            status: 'trained',
            createdAt: '2023-01-01T00:00:00Z'
          }
        ]
      })
    );
  }),
  
  rest.post('https://api.dataflowhub.ai/v1/models/predict', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        prediction: [0.8, 0.2],
        confidence: 0.9
      })
    );
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
```

### Context Mocking

Use vi.mock to mock React context:

```typescript
vi.mock('../context/MLContext', () => ({
  useMLContext: () => ({
    datasets: [],
    models: [],
    addDataset: vi.fn(),
    addModel: vi.fn(),
    isLoading: false
  }),
  MLProvider: ({ children }) => <div>{children}</div>
}));
```

## Test Data

- Use fixtures for test data
- Store fixtures in a `__fixtures__` directory
- Keep test data minimal but representative
- Use factories to generate test data when needed

Example fixture:

```typescript
// __fixtures__/datasets.ts
export const sampleDatasets = [
  {
    id: 'dataset-1',
    name: 'Sample Dataset 1',
    description: 'A sample dataset for testing',
    rows: 100,
    columns: 5,
    dateUploaded: '2023-01-01T00:00:00Z',
    fileType: 'csv',
    fileSize: '10KB',
    projectId: 'project-1',
    previewData: {
      columns: ['id', 'name', 'age', 'city', 'salary'],
      rows: [
        ['1', 'John Doe', '30', 'New York', '100000'],
        ['2', 'Jane Smith', '25', 'San Francisco', '120000'],
        ['3', 'Bob Johnson', '40', 'Chicago', '90000']
      ]
    }
  }
];
```

## Continuous Integration

Tests are run automatically on pull requests and pushes to the main branch. The CI pipeline includes:

1. Linting
2. Type checking
3. Unit and integration tests
4. Build verification
5. E2E tests (on selected branches)

## Test Best Practices

### General Best Practices

- Write tests before or alongside code (TDD approach when possible)
- Keep tests simple and focused
- Test behavior, not implementation details
- Use descriptive test names that explain what is being tested
- Arrange-Act-Assert pattern for test structure
- Avoid test interdependence

### Component Testing Best Practices

- Test from the user's perspective
- Use screen queries that match how users find elements
- Prefer `getByRole` over other queries when possible
- Test accessibility concerns
- Test error states and loading states
- Verify that components respond correctly to props and user interactions

### Integration Testing Best Practices

- Focus on component interactions
- Test common user flows
- Verify that data flows correctly between components
- Test error handling and edge cases

### End-to-End Testing Best Practices

- Test critical user journeys
- Keep E2E tests focused on high-value flows
- Use data-testid attributes for stable selectors
- Clean up test data after tests
- Use custom commands for common operations

## Accessibility Testing

All components should be tested for accessibility:

- Ensure proper ARIA attributes
- Verify keyboard navigation
- Check color contrast
- Test with screen readers
- Ensure proper focus management

Example accessibility test:

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '../components/common/Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Performance Testing

Critical components and operations should be tested for performance:

- Measure render times for complex components
- Test data loading performance
- Verify that large datasets can be handled efficiently
- Test responsiveness under load

Example performance test:

```typescript
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DataTable from '../components/common/DataTable';

describe('DataTable performance', () => {
  it('renders large datasets efficiently', () => {
    // Generate large dataset
    const columns = ['id', 'name', 'age', 'city', 'salary'];
    const rows = Array.from({ length: 1000 }, (_, i) => [
      i.toString(),
      `Person ${i}`,
      Math.floor(Math.random() * 50 + 20).toString(),
      ['New York', 'San Francisco', 'Chicago', 'Boston'][Math.floor(Math.random() * 4)],
      Math.floor(Math.random() * 100000 + 50000).toString()
    ]);

    // Measure render time
    const start = performance.now();
    render(<DataTable columns={columns} rows={rows} />);
    const end = performance.now();

    // Render should be under 100ms for good performance
    expect(end - start).toBeLessThan(100);
  });
});
```

## Test Debugging

When tests fail, use these debugging techniques:

1. Use `screen.debug()` to see the rendered output
2. Use `console.log` for variable inspection
3. Use the `--inspect` flag with Node.js debugger
4. For E2E tests, use Cypress's interactive mode

## Conclusion

Following these testing guidelines will help ensure the quality, reliability, and maintainability of the DataFlowHub AI platform. Tests should be treated as first-class citizens in the development process, not as an afterthought.

Remember that tests are also documentation. Well-written tests can help new developers understand how components and features are supposed to work.