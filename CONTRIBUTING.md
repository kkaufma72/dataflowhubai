# Contributing to DataFlowHub AI

Thank you for your interest in contributing to DataFlowHub AI! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/kkaufma72/dataflowhubai.git
   cd dataflowhubai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your Supabase credentials
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The application will be available at `http://localhost:3002`

### Project Structure

- `/src`: Source code
  - `/components`: React components
  - `/context`: React context providers
  - `/lib`: Utility functions and services
  - `/pages`: Page components
  - `/types`: TypeScript type definitions
- `/public`: Static assets
- `/supabase`: Supabase configuration and migrations
  - `/functions`: Supabase Edge Functions
  - `/migrations`: Database migrations

## Coding Standards

### General Guidelines

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Write self-documenting code with clear variable and function names
- Add comments for complex logic
- Keep components small and focused on a single responsibility
- Use functional components with hooks

### TypeScript

- Define proper types for all variables, parameters, and return values
- Use interfaces for complex objects
- Avoid using `any` type when possible
- Use type guards for runtime type checking

### React

- Use functional components with hooks
- Keep state as local as possible
- Use context for global state management
- Break down large components into smaller, reusable ones
- Use proper React key props in lists

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Use responsive design principles
- Ensure accessibility compliance

## Pull Request Process

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with descriptive commit messages:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

3. Push your branch to the repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request against the `main` branch
5. Ensure all tests pass and the code meets the coding standards
6. Request a review from a maintainer
7. Address any feedback from the review
8. Once approved, your PR will be merged

## Testing

### Running Tests

```bash
npm run test
```

### Writing Tests

- Write tests for all new features and bug fixes
- Use React Testing Library for component tests
- Use Vitest for unit tests
- Aim for high test coverage, especially for critical functionality
- Test edge cases and error handling

### Test Structure

- Place test files next to the code they test with a `.test.ts` or `.test.tsx` extension
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Use mocks for external dependencies

## Documentation

- Update documentation for any changes to the API or user-facing features
- Document complex functions and components
- Keep the README up to date
- Add JSDoc comments for public functions and interfaces

## Reporting Issues

- Use the issue tracker to report bugs or request features
- Provide detailed steps to reproduce bugs
- Include screenshots or videos if applicable
- Specify the browser and operating system for frontend issues

## Code of Conduct

- Be respectful and inclusive
- Value diverse perspectives
- Focus on constructive feedback
- Help others learn and grow

Thank you for contributing to DataFlowHub AI!