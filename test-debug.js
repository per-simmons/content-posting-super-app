const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`[CONSOLE]`, msg.text());
  });
  
  console.log('Opening /lex page...');
  await page.goto('http://localhost:3000/lex');
  await page.waitForTimeout(2000);
  
  // Click title to start
  const titlePlaceholder = await page.locator('h1:has-text("Title...")').count();
  if (titlePlaceholder > 0) {
    await page.click('h1:has-text("Title...")');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  }
  
  // Type text
  await page.keyboard.type('Test bold text');
  await page.waitForTimeout(500);
  
  // Try to select "bold" with keyboard
  console.log('\nSelecting text with keyboard...');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  await page.waitForTimeout(1000);
  
  // Check if toolbar is visible
  const toolbar = await page.locator('[role="toolbar"]');
  const isVisible = await toolbar.isVisible();
  console.log('Toolbar visible:', isVisible);
  
  if (!isVisible) {
    console.log('\nToolbar not appearing with keyboard selection.');
    console.log('Trying mouse selection...');
    
    // Try with mouse
    const editor = await page.locator('[contenteditable="true"]');
    const box = await editor.boundingBox();
    if (box) {
      // Click at start of "bold"
      await page.mouse.click(box.x + 50, box.y + 10);
      await page.waitForTimeout(500);
      
      // Drag to select
      await page.mouse.down();
      await page.mouse.move(box.x + 90, box.y + 10);
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      const isVisibleAfterMouse = await toolbar.isVisible();
      console.log('Toolbar visible after mouse selection:', isVisibleAfterMouse);
    }
  }
  
  // Check for any errors in the console
  const logs = await page.evaluate(() => {
    return {
      selection: window.getSelection()?.toString(),
      editorContent: document.querySelector('[contenteditable="true"]')?.textContent,
      hasToolbar: document.querySelector('[role="toolbar"]') !== null
    };
  });
  
  console.log('\nPage state:');
  console.log('Selected text:', logs.selection);
  console.log('Editor content:', logs.editorContent);
  console.log('Toolbar in DOM:', logs.hasToolbar);
  
  console.log('\nTest complete. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();