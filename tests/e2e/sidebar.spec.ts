import { test, expect } from '@playwright/test';

test.describe('Enhanced Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show collapsed sidebar with flyout on hover', async ({ page }) => {
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Verify sidebar is collapsed
    const sidebar = page.locator('[data-testid="enhanced-sidebar"]');
    await expect(sidebar).toHaveClass(/w-\[72px\]/);
    
    // Hover over a parent item with children (e.g., "Configurações")
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    // Wait for flyout to appear
    const flyout = page.locator('#portal-root [data-testid="sidebar-flyout"]');
    await expect(flyout).toBeVisible({ timeout: 500 });
    
    // Verify flyout is in portal
    const portalRoot = page.locator('#portal-root');
    await expect(portalRoot).toContainText('Integrações');
    
    // Click on parent should pin flyout (not navigate)
    await configItem.click();
    
    // Flyout should remain visible (pinned)
    await expect(flyout).toBeVisible();
    
    // Click on child should navigate
    const integracoesItem = flyout.locator('[data-testid="nav-item-integracoes"]');
    await integracoesItem.click();
    
    // Should navigate to integracoes page
    await expect(page).toHaveURL(/.*integracoes/);
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
    
    // Hover over item - no tooltip should appear
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    const tooltip = page.locator('[data-testid="sidebar-tooltip"]');
    await expect(tooltip).not.toBeVisible();
    
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Now hover should show tooltip
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

  test('should ensure flyout has correct z-index and is clickable', async ({ page }) => {
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Hover to open flyout
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    // Check flyout is in portal
    const flyout = page.locator('#portal-root [data-testid="sidebar-flyout"]');
    await expect(flyout).toBeVisible();
    
    // Verify z-index
    const zIndex = await flyout.evaluate(el => getComputedStyle(el).zIndex);
    expect(zIndex).toBe('80');
    
    // Flyout should be clickable (not clipped)
    const integracoesItem = flyout.locator('[data-testid="nav-item-integracoes"]');
    await expect(integracoesItem).toBeVisible();
    await integracoesItem.click();
    
    // Should navigate successfully
    await expect(page).toHaveURL(/.*integracoes/);
  });

  test('should close flyout on escape key', async ({ page }) => {
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    
    // Hover to open flyout
    const configItem = page.locator('[data-testid="nav-item-configuracoes"]');
    await configItem.hover();
    
    const flyout = page.locator('#portal-root [data-testid="sidebar-flyout"]');
    await expect(flyout).toBeVisible();
    
    // Press escape
    await page.keyboard.press('Escape');
    
    // Flyout should close
    await expect(flyout).not.toBeVisible();
  });
});