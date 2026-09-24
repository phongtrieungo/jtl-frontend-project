// packages/shared/src/components/components.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { Alert } from './Alert';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Spinner } from './Spinner';

describe('Story 2.3: Shared UI Primitives & Accessibility', () => {
  describe('Button Component', () => {
    it('renders with prominent focus-visible ring styles and click handlers', () => {
      const handleClick = vi.fn();
      render(
        <Button variant="primary" onClick={handleClick}>
          Submit Task
        </Button>
      );

      const button = screen.getByRole('button', { name: /submit task/i });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('focus-visible:ring-2');
      expect(button.className).toContain('focus-visible:ring-indigo-600');

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders accessible loading state with Spinner and aria-busy', () => {
      render(
        <Button isLoading variant="primary">
          Saving...
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders destructive and secondary variants', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button').className).toContain('bg-rose-600');

      rerender(<Button variant="secondary">Cancel</Button>);
      expect(screen.getByRole('button').className).toContain('bg-slate-100');
    });
  });

  describe('Input Component (Accessibility Contract)', () => {
    it('renders label linked via htmlFor and id', () => {
      render(<Input id="task-title" label="Task Title" />);

      const label = screen.getByText('Task Title');
      const input = screen.getByRole('textbox', { name: 'Task Title' });

      expect(label).toHaveAttribute('for', 'task-title');
      expect(input).toHaveAttribute('id', 'task-title');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input.className).toContain('focus-visible:ring-indigo-600');
    });

    it('sets aria-invalid="true" and connects error message via aria-describedby', () => {
      render(
        <Input
          id="task-title"
          label="Task Title"
          error="Task title cannot be empty"
        />
      );

      const input = screen.getByRole('textbox', { name: 'Task Title' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'task-title-error');

      const alertMessage = screen.getByRole('alert');
      expect(alertMessage).toHaveAttribute('id', 'task-title-error');
      expect(alertMessage).toHaveTextContent('Task title cannot be empty');
      expect(alertMessage.className).toContain('text-rose-600');
    });
  });

  describe('Badge Component', () => {
    it('renders optimistic pulse badge when pulse is true', () => {
      render(
        <Badge variant="amber" pulse>
          Saving...
        </Badge>
      );

      const badge = screen.getByText('Saving...');
      expect(badge.className).toContain('bg-amber-50');
      expect(badge.className).toContain('animate-pulse');
    });

    it('renders emerald completed badge', () => {
      render(<Badge variant="emerald">Completed</Badge>);
      const badge = screen.getByText('Completed');
      expect(badge.className).toContain('bg-emerald-50');
    });
  });

  describe('Alert Component', () => {
    it('renders role="alert" for error/warning and role="status" for info/success', () => {
      const { rerender } = render(
        <Alert variant="error" title="Rollback Error">
          Unable to save changes.
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Rollback Error')).toBeInTheDocument();

      rerender(
        <Alert variant="success" title="Success">
          Task completed!
        </Alert>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('triggers onDismiss when close button is clicked', () => {
      const handleDismiss = vi.fn();
      render(
        <Alert variant="info" onDismiss={handleDismiss}>
          Informational note.
        </Alert>
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      fireEvent.click(dismissButton);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Component', () => {
    it('renders composite card structure with standard Slate tokens', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Details</p>
          </CardContent>
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card.className).toContain('rounded-xl');
      expect(card.className).toContain('border-slate-200');
      expect(screen.getByText('User Profile')).toBeInTheDocument();
    });
  });

  describe('Spinner Component', () => {
    it('renders accessible spinner with role="status" and sr-only label', () => {
      render(<Spinner size="md" label="Loading data..." />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toHaveClass('sr-only');
    });
  });
});
