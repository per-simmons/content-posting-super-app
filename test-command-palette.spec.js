const { test, expect } = require('@playwright/test');

test('Command palette appears near cursor on Cmd+K', async ({ page }) => {
  // Navigate to the Lex editor
  await page.goto('http://localhost:3002/lex');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Click in the title editor to focus it
  const titleEditor = page.locator('[data-editor-type="title"]');
  await titleEditor.click();
  
  // Type some text to position the cursor
  await titleEditor.type('Test Document Title');
  
  // Press Enter to move to body editor
  await page.keyboard.press('Enter');
  
  // Wait for body editor to be visible
  await page.waitForSelector('[data-editor-type="main"]', { state: 'visible' });
  
  // Click in the body editor
  const bodyEditor = page.locator('[data-editor-type="main"]');
  await bodyEditor.click();
  
  // Type some text to position cursor
  await bodyEditor.type('This is some test content for the editor.');
  
  // Get cursor position before opening command palette
  const cursorPosition = await bodyEditor.boundingBox();
  
  // Press Cmd+K to open command palette
  await page.keyboard.press('Meta+k');
  
  // Wait for command palette to appear
  await page.waitForSelector('.cp-palette', { state: 'visible' });
  
  // Get command palette position
  const palette = page.locator('.cp-palette');
  const paletteBox = await palette.boundingBox();
  
  // Verify palette is positioned near the cursor, not at bottom of screen
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const isNearBottom = paletteBox.y > (viewportHeight * 0.8); // Bottom 20% of screen
  
  console.log('Cursor position:', cursorPosition);
  console.log('Palette position:', paletteBox);
  console.log('Viewport height:', viewportHeight);
  console.log('Is palette near bottom?', isNearBottom);
  
  // Assert that palette is NOT positioned at the bottom
  expect(isNearBottom).toBe(false);
  
  // Verify palette has correct styling
  await expect(palette).toHaveCSS('background-color', 'rgb(21, 25, 34)'); // #151922
  await expect(palette).toHaveCSS('width', '420px');
  
  // Verify first command is "Edit selected text"
  const firstCommand = palette.locator('.cp-row').first();
  await expect(firstCommand).toContainText('Edit selected text');
  
  console.log('✅ Command palette test passed!');
});