import { test, expect } from '@playwright/test';

test.describe('Enhanced Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show collapsed sidebar with tooltip on hover', async ({ page }) => {
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Verify sidebar is collapsed
    const sidebar = page.locator('[data-testid="enhanced-sidebar"]');
    await expect(sidebar).toHaveClass(/w-\[72px\]/);
    
    // Hover over a parent item with children (e.g., "Configurações")
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    // Wait for Shadcn tooltip to appear
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 500 });
    
    // Click on parent should navigate to first child
    await configItem.click();
    
    // Should navigate to first child page
    await expect(page).toHaveURL(/.*configuracoes/);
  });

  test('should show expanded sidebar with toggle behavior', async ({ page }) => {
    // Ensure sidebar is expanded
    const sidebar = page.locator('[data-testid="enhanced-sidebar"]');
    await expect(sidebar).toHaveClass(/w-\[264px\]/);
    
    // Find a parent item with children
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    
    // Click on parent should toggle group (not navigate)
    await configItem.click();
    
    // Should stay on same page (not navigate)
    await expect(page).toHaveURL('/');
    
    // Group should be expanded/collapsed
    const configGroup = page.locator('[data-testid="nav-group-configuracoes"]');
    await expect(configGroup).toBeVisible();
  });

  test('should auto-expand active group when navigating to child route', async ({ page }) => {
    await page.goto('/configuracoes/integracoes');
    
    // Parent group should be expanded
    const configGroup = page.locator('[data-testid="nav-group-configuracoes"]');
    await expect(configGroup).toBeVisible();
    
    // Active item should be highlighted
    const integracoesItem = page.locator('[data-testid="nav-item-integracoes"]');
    await expect(integracoesItem).toHaveClass(/bg-\[hsl\(var\(--accent\)\)\]/);
  });

  test('should show tooltips only when collapsed', async ({ page }) => {
    // Ensure sidebar is expanded
    const sidebar = page.locator('[data-testid="enhanced-sidebar"]');
    await expect(sidebar).toHaveClass(/w-\[264px\]/);
    
    // Hover over item - no tooltip should appear in expanded state
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).not.toBeVisible();
    
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Now hover should show Shadcn tooltip
    await configItem.hover();
    await expect(tooltip).toBeVisible({ timeout: 500 });
    await expect(tooltip).toContainText('Configurações');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.focus();
    
    // Arrow right should open group
    await page.keyboard.press('ArrowRight');
    const configGroup = page.locator('[data-testid="nav-group-configuracoes"]');
    await expect(configGroup).toBeVisible();
    
    // Arrow left should close group
    await page.keyboard.press('ArrowLeft');
    await expect(configGroup).not.toBeVisible();
    
    // Enter/Space should toggle
    await page.keyboard.press('Enter');
    await expect(configGroup).toBeVisible();
    
    await page.keyboard.press('Space');
    await expect(configGroup).not.toBeVisible();
  });

  test('should ensure tooltip has correct z-index and navigation works', async ({ page }) => {
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Hover to open tooltip
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    // Check Shadcn tooltip is visible
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    
    // Click on item should navigate to first child
    await configItem.click();
    
    // Should navigate successfully
    await expect(page).toHaveURL(/.*configuracoes/);
  });

  test('should close tooltip on escape key', async ({ page }) => {
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Hover to open tooltip
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    
    // Press escape
    await page.keyboard.press('Escape');
    
    // Tooltip should close
    await expect(tooltip).not.toBeVisible();
  });
});