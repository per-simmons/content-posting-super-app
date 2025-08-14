const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('='.repeat(60));
  console.log('FINAL TOOLBAR FUNCTIONALITY TEST');
  console.log('='.repeat(60));
  
  console.log('\nNavigating to /lex page...');
  await page.goto('http://localhost:3000/lex');
  await page.waitForTimeout(2000);
  
  // Skip title and go to editor
  const titlePlaceholder = await page.locator('h1:has-text("Title...")').count();
  if (titlePlaceholder > 0) {
    await page.click('h1:has-text("Title...")');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
  }
  
  // Focus editor and add text
  const editor = await page.locator('[contenteditable="true"]');
  await editor.click();
  await page.keyboard.type('This is bold text for testing');
  await page.waitForTimeout(500);
  
  // Select "bold" using JavaScript
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
          
          // Trigger events
          document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
          document.dispatchEvent(new Event('mouseup', { bubbles: true }));
        }
      }
    }
  });
  await page.waitForTimeout(1000);
  
  // Check toolbar visibility
  const toolbar = await page.locator('[role="toolbar"]');
  const isToolbarVisible = await toolbar.isVisible();
  console.log('\nToolbar visible after selection:', isToolbarVisible);
  
  if (isToolbarVisible) {
    // Test Bold
    console.log('\n[TEST 1] Testing Bold...');
    await page.locator('button[title="Bold"]').click();
    await page.waitForTimeout(1000);
    
    let html = await editor.innerHTML();
    console.log('HTML after Bold:', html);
    const boldSuccess = html.includes('<strong>bold</strong>') || html.includes('<b>bold</b>');
    console.log('Bold result:', boldSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Test Italic
    console.log('\n[TEST 2] Testing Italic...');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('This is italic text');
    await page.waitForTimeout(500);
    
    // Select "italic" using JavaScript
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = editor.firstChild;
        
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent;
          const startIndex = text.indexOf('italic');
          if (startIndex !== -1) {
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, startIndex + 6);
            selection.removeAllRanges();
            selection.addRange(range);
            
            document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
            document.dispatchEvent(new Event('mouseup', { bubbles: true }));
          }
        }
      }
    });
    await page.waitForTimeout(1000);
    
    await page.locator('button[title="Italic"]').click();
    await page.waitForTimeout(1000);
    
    html = await editor.innerHTML();
    console.log('HTML after Italic:', html);
    const italicSuccess = html.includes('<em>italic</em>') || html.includes('<i>italic</i>');
    console.log('Italic result:', italicSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Test Underline
    console.log('\n[TEST 3] Testing Underline...');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Underline this text');
    await page.waitForTimeout(500);
    
    // Select "this" using JavaScript
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = editor.firstChild;
        
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent;
          const startIndex = text.indexOf('this');
          if (startIndex !== -1) {
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, startIndex + 4);
            selection.removeAllRanges();
            selection.addRange(range);
            
            document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
            document.dispatchEvent(new Event('mouseup', { bubbles: true }));
          }
        }
      }
    });
    await page.waitForTimeout(1000);
    
    await page.locator('button[title="Underline"]').click();
    await page.waitForTimeout(1000);
    
    html = await editor.innerHTML();
    console.log('HTML after Underline:', html);
    const underlineSuccess = html.includes('<u>this</u>');
    console.log('Underline result:', underlineSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Test Strikethrough
    console.log('\n[TEST 4] Testing Strikethrough...');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Strike this out');
    await page.waitForTimeout(500);
    
    // Select all using JavaScript
    await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
        document.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    });
    await page.waitForTimeout(1000);
    
    await page.locator('button[title="Strikethrough"]').click();
    await page.waitForTimeout(1000);
    
    html = await editor.innerHTML();
    console.log('HTML after Strikethrough:', html);
    const strikeSuccess = html.includes('<s>') || html.includes('<strike>');
    console.log('Strikethrough result:', strikeSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Bold:', boldSuccess ? '✓ PASSED' : '✗ FAILED');
    console.log('Italic:', italicSuccess ? '✓ PASSED' : '✗ FAILED');
    console.log('Underline:', underlineSuccess ? '✓ PASSED' : '✗ FAILED');
    console.log('Strikethrough:', strikeSuccess ? '✓ PASSED' : '✗ FAILED');
    
    const totalTests = 4;
    const passedTests = (boldSuccess ? 1 : 0) + (italicSuccess ? 1 : 0) + 
                       (underlineSuccess ? 1 : 0) + (strikeSuccess ? 1 : 0);
    console.log('\nTotal Tests:', totalTests);
    console.log('Passed:', passedTests);
    console.log('Failed:', totalTests - passedTests);
    console.log('Success Rate:', Math.round((passedTests / totalTests) * 100) + '%');
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! The toolbar is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the output above for details.');
    }
  } else {
    console.log('ERROR: Toolbar did not appear when text was selected');
  }
  
  console.log('\nTest complete. Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();