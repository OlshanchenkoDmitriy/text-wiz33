# Testing Guide for Text Wizard

This document describes the testing setup and practices for the Text Wizard project.

## Testing Stack

The project uses the following testing technologies:
- **Vitest**: Fast Vite-native test runner with Jest-compatible API
- **@testing-library/react**: Simple and complete testing utilities for React components
- **@testing-library/user-event**: Utilities for simulating user interactions
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **jsdom**: DOM environment for testing

## Configuration

### Vitest Configuration
The testing environment is configured in `vitest.config.ts`:
- Uses jsdom environment for DOM testing
- Global test functions (describe, it, expect) are available without imports
- Path aliases (@/) are configured to match the project structure
- Setup file is loaded automatically

### Test Setup
The `test/setup.ts` file imports `@testing-library/jest-dom` to provide enhanced DOM matchers like `toBeInTheDocument()`, `toHaveClass()`, etc.

## Running Tests

### Available Commands
```bash
# Run tests in watch mode (default)
npm run test

# Run tests once and exit
npm run test -- --run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui

# Run tests in watch mode (explicit)
npm run test:watch
```

### Test File Patterns
Tests are co-located with source files using the following naming patterns:
- `*.test.ts` - Unit tests for TypeScript modules
- `*.test.tsx` - Component tests for React components

## Writing Tests

### Utility Function Tests
For pure functions and utilities, write straightforward unit tests:

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should combine class names correctly', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });
});
```

### Component Tests
For React components, use Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(Button({ children: 'Click me' }));
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### Mock Functions and Dependencies
Use Vitest's built-in mocking capabilities:

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFunction = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

## Test Organization

### Directory Structure
```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts
│   ├── storage.ts
│   └── storage.test.ts
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
test/
└── setup.ts
```

### Test Categories

1. **Unit Tests**: Test individual functions and utilities
   - Focus on pure functions in `src/lib/` and `src/utils/`
   - Test edge cases and error conditions
   - Mock external dependencies

2. **Component Tests**: Test React component behavior
   - Test user interactions
   - Test props and state changes
   - Test accessibility features
   - Use Testing Library queries by role/label

3. **Integration Tests**: Test component interactions
   - Test data flow between components
   - Test context providers
   - Test routing behavior

## Best Practices

### Writing Good Tests
1. **Descriptive test names**: Use clear, specific descriptions
2. **Test behavior, not implementation**: Focus on what users see and do
3. **Arrange, Act, Assert pattern**: Structure tests clearly
4. **Test edge cases**: Include error conditions and boundary values
5. **Keep tests isolated**: Each test should be independent

### Testing Guidelines
1. **Pure functions first**: Start with utility functions - they're easiest to test
2. **Mock external dependencies**: Use vi.mock() for modules, localStorage, etc.
3. **Query by accessibility**: Prefer `getByRole()` over `getByTestId()`
4. **Test user interactions**: Use `@testing-library/user-event` for realistic interactions
5. **Avoid implementation details**: Don't test internal component state directly

### Coverage Goals
- Aim for high coverage on utility functions (90%+)
- Focus on critical user paths in components
- Don't obsess over 100% coverage - quality over quantity

## Examples

### Testing a Utility Function
```typescript
// src/lib/string-utils.test.ts
import { describe, it, expect } from 'vitest';
import { removeExtraSpaces } from './string-utils';

describe('removeExtraSpaces', () => {
  it('should remove extra spaces between words', () => {
    expect(removeExtraSpaces('hello    world')).toBe('hello world');
  });

  it('should trim leading and trailing spaces', () => {
    expect(removeExtraSpaces('  hello world  ')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(removeExtraSpaces('')).toBe('');
  });
});
```

### Testing a React Component
```typescript
// src/components/Editor/Editor.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Editor } from './Editor';

describe('Editor Component', () => {
  it('should update text when typing', async () => {
    const user = userEvent.setup();
    render(Editor({}));
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');
    
    expect(textarea).toHaveValue('Hello world');
  });
});
```

## Current Test Coverage

The project currently includes:
- ✅ Utility function tests (`src/lib/utils.test.ts`)
- ✅ Storage utility tests (`src/lib/storage.test.ts`)
- 🚧 Component tests (to be added)

## Future Testing Improvements

1. **Add component tests** for main UI components
2. **Integration tests** for complex user workflows
3. **Visual regression tests** for UI consistency
4. **Performance tests** for large text processing
5. **E2E tests** for critical user journeys

## Troubleshooting

### Common Issues

**Tests fail with import errors**: Ensure vitest.config.ts has correct path aliases

**DOM-related errors**: Make sure jsdom environment is configured and setup file is loaded

**Mock issues**: Use vi.clearAllMocks() in beforeEach hooks to reset mocks

**TypeScript errors**: Ensure test files are included in tsconfig.json

For more details, see the [Vitest documentation](https://vitest.dev/) and [Testing Library guides](https://testing-library.com/docs/).