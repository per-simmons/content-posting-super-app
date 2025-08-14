const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to /lex page...');
  await page.goto('http://localhost:3000/lex');
  await page.waitForTimeout(2000);
  
  // Skip title and go directly to editor
  const titlePlaceholder = await page.locator('h1:has-text("Title...")').count();
  if (titlePlaceholder > 0) {
    await page.click('h1:has-text("Title...")');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
  }
  
  // Focus editor and type text
  console.log('Typing in editor...');
  const editor = await page.locator('[contenteditable="true"]');
  await editor.click();
  await page.keyboard.type('Test text for formatting');
  await page.waitForTimeout(500);
  
  // Select all text using keyboard (Meta+A for Mac)
  console.log('Selecting all text with Cmd+A...');
  await page.keyboard.press('Meta+A');
  await page.waitForTimeout(1000);
  
  // Check if text is selected
  const selectedText = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      text: sel.toString(),
      rangeCount: sel.rangeCount,
      anchorNode: sel.anchorNode ? sel.anchorNode.nodeName : null,
      focusNode: sel.focusNode ? sel.focusNode.nodeName : null
    };
  });
  console.log('Selection info:', selectedText);
  
  // Check toolbar visibility
  const toolbar = await page.locator('[role="toolbar"]');
  const isToolbarVisible = await toolbar.isVisible();
  console.log('Toolbar visible:', isToolbarVisible);
  
  if (isToolbarVisible) {
    // Log current HTML
    console.log('\nBefore formatting:');
    let html = await editor.innerHTML();
    console.log('HTML:', html);
    console.log('Text content:', await editor.textContent());
    
    // Try to apply bold using document.execCommand directly
    console.log('\nTrying direct execCommand...');
    const commandResult = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      editor.focus();
      
      // Make sure we have a selection
      const sel = window.getSelection();
      if (sel.rangeCount === 0) {
        // Try to select all text
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      // Try the command
      const result = document.execCommand('bold', false);
      return {
        success: result,
        selectionAfter: sel.toString(),
        html: editor.innerHTML
      };
    });
    console.log('Direct execCommand result:', commandResult);
    
    // Now try clicking the button
    console.log('\nClicking Bold button...');
    const boldButton = await page.locator('button[title="Bold"]');
    
    // First select text again
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(500);
    
    // Use dispatchEvent to trigger mousedown
    await boldButton.dispatchEvent('mousedown');
    await page.waitForTimeout(1000);
    
    console.log('\nAfter button click:');
    html = await editor.innerHTML();
    console.log('HTML:', html);
    console.log('Text content:', await editor.textContent());
    
    // Check if any bold/strong tags exist
    const hasBold = html.includes('<b>') || html.includes('<strong>') || html.includes('font-weight');
    console.log('Has bold formatting:', hasBold);
  }
  
  console.log('\nTest complete. Browser will remain open.');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();