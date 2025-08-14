const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('='.repeat(60));
  console.log('FINAL TOOLBAR TEST WITH FIXES');
  console.log('='.repeat(60));
  
  // Clear cache and cookies
  await context.clearCookies();
  
  console.log('\nNavigating to /lex (with fresh cache)...');
  await page.goto('http://localhost:3000/lex', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Click title to start
  const titlePlaceholder = await page.locator('h1:has-text("Title...")').count();
  if (titlePlaceholder > 0) {
    await page.click('h1:has-text("Title...")');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  }
  
  // Check editor direction
  const editorStyles = await page.evaluate(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (editor) {
      const styles = window.getComputedStyle(editor);
      return {
        direction: styles.direction,
        textAlign: styles.textAlign
      };
    }
    return null;
  });
  
  console.log('\nEditor styles:');
  console.log('Direction:', editorStyles?.direction);
  console.log('Text align:', editorStyles?.textAlign);
  
  // Type text
  await page.keyboard.type('This is bold text');
  await page.waitForTimeout(500);
  
  // Check content
  const content = await page.evaluate(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    return editor ? editor.textContent : null;
  });
  
  console.log('\nTyped text appears as:', content);
  
  if (content === 'This is bold text') {
    console.log('✓ Text direction is correct (LTR)');
  } else {
    console.log('✗ Text direction issue - text is reversed!');
  }
  
  // Select "bold" using JavaScript for reliability
  await page.evaluate(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (editor) {
      editor.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      const textNode = editor.firstChild;
      
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent;
        const startIndex = text.indexOf('bold');
        if (startIndex !== -1) {
          range.setStart(textNode, startIndex);
          range.setEnd(textNode, startIndex + 4);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Trigger selection events
          document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
          document.dispatchEvent(new Event('mouseup', { bubbles: true }));
        }
      }
    }
  });
  await page.waitForTimeout(1000);
  
  // Check toolbar
  const toolbar = await page.locator('[role="toolbar"]');
  const isToolbarVisible = await toolbar.isVisible();
  console.log('\nToolbar visible:', isToolbarVisible);
  
  if (isToolbarVisible) {
    console.log('✓ Toolbar appears with selection');
    
    // Try clicking Bold button
    await page.locator('button[title="Bold"]').click();
    await page.waitForTimeout(1000);
    
    const html = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      return editor ? editor.innerHTML : null;
    });
    
    console.log('\nHTML after Bold:', html);
    
    if (html && (html.includes('<strong>bold</strong>') || html.includes('<b>bold</b>'))) {
      console.log('✓ Bold formatting applied successfully');
    } else {
      console.log('✗ Bold formatting not applied');
    }
  } else {
    console.log('✗ Toolbar not appearing');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  
  console.log('\nBrowser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();