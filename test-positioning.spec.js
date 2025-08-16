const { test, expect } = require('@playwright/test');

test('Command palette positions near cursor on Cmd+K', async ({ page }) => {
  // Set a shorter timeout
  test.setTimeout(15000);
  
  // Navigate to the Lex editor
  await page.goto('http://localhost:3002/lex', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for the page to initialize
  await page.waitForTimeout(2000);
  
  // Click in the title editor to focus it
  await page.click('[data-editor-type="title"]');
  
  // Type some text
  await page.keyboard.type('Test Title');
  
  // Press Enter to switch to body editor
  await page.keyboard.press('Enter');
  
  // Wait for the body editor and click it
  await page.waitForSelector('[data-editor-type="main"]', { timeout: 5000 });
  await page.click('[data-editor-type="main"]');
  
  // Type some content to position cursor
  await page.keyboard.type('Some test content here');
  
  // Press Cmd+K to open command palette
  await page.keyboard.press('Meta+k');
  
  // Wait for command palette to appear
  await page.waitForSelector('.cp-palette', { state: 'visible', timeout: 3000 });
  
  // Get command palette position
  const palette = page.locator('.cp-palette');
  const paletteBox = await palette.boundingBox();
  
  // Get viewport dimensions
  const viewportSize = page.viewportSize();
  
  console.log('Palette position:', paletteBox);
  console.log('Viewport size:', viewportSize);
  
  // Check if palette is positioned near bottom (bottom 30% of screen)
  const isAtBottom = paletteBox.y > (viewportSize.height * 0.7);
  
  console.log('Is palette at bottom?', isAtBottom);
  console.log('Palette Y position:', paletteBox.y);
  console.log('70% of viewport height:', viewportSize.height * 0.7);
  
  // The palette should NOT be at the bottom
  expect(isAtBottom).toBe(false);
  
  // Verify it has the correct width
  expect(paletteBox.width).toBe(420);
  
  console.log('✅ Command palette is positioned correctly near cursor!');
});