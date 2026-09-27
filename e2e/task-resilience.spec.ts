import { expect, test } from '@playwright/test';

test('creates a task optimistically and rolls back a chaotic write', async ({ page }) => {
  await page.goto('/todos');
  await page.getByLabel('Active user').selectOption({ label: 'Ada Lovelace' });
  await expect(page).toHaveURL(/\/todos\?.*userId=user-1/);

  const titleInput = page.getByLabel('Task title');
  const firstTitle = 'Verify resilient showcase';
  await titleInput.fill(firstTitle);
  await page.getByRole('button', { name: 'Create task' }).click();

  const savedTask = page.getByRole('listitem').filter({ hasText: firstTitle });
  await expect(savedTask).toContainText('Saving...');
  await expect(savedTask).toContainText('To do');

  await page.getByRole('button', { name: 'Chaos off' }).click();
  await expect(page.getByRole('button', { name: 'Chaos on' })).toHaveAttribute('aria-pressed', 'true');

  const rollbackTitle = 'Rollback this chaotic task';
  await titleInput.fill(rollbackTitle);
  await page.getByRole('button', { name: 'Create task' }).click();
  const optimisticTask = page.getByRole('listitem').filter({ hasText: rollbackTitle });
  await expect(optimisticTask).toContainText('Saving...');

  const rollbackAlert = page.getByRole('alert').filter({ hasText: 'Task not saved' });
  await expect(rollbackAlert).toContainText('Your changes were reverted.');
  await expect(rollbackAlert.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(optimisticTask).toHaveCount(0);
});
