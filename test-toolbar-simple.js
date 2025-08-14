const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('='.repeat(60));
  console.log('SIMPLE TOOLBAR FUNCTIONALITY TEST');
  console.log('='.repeat(60));
  
  console.log('\nNavigating to /lex page...');
  await page.goto('http://localhost:3000/lex');
  await page.waitForTimeout(2000);
  
  // Skip title setup
  const titlePlaceholder = await page.locator('h1:has-text("Title...")').count();
  if (titlePlaceholder > 0) {
    await page.click('h1:has-text("Title...")');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
  }
  
  const editor = await page.locator('[contenteditable="true"]');
  await editor.click();
  
  // Test Bold
  console.log('\n[TEST 1] Testing Bold...');
  await page.keyboard.type('This is a test');
  await page.waitForTimeout(500);
  
  // Select "test"
  await page.keyboard.press('Control+Shift+ArrowLeft');
  await page.waitForTimeout(500);
  
  // Check if toolbar appears
  const toolbar = await page.locator('[role="toolbar"]');
  const isToolbarVisible = await toolbar.isVisible();
  console.log('Toolbar visible:', isToolbarVisible);
  
  if (isToolbarVisible) {
    // Click Bold button
    await page.locator('button[title="Bold"]').click();
    await page.waitForTimeout(1000);
    
    // Check HTML
    let html = await editor.innerHTML();
    console.log('HTML after Bold:', html);
    const boldSuccess = html.includes('<strong>') || html.includes('<b>');
    console.log('Bold result:', boldSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Clear and test Italic
    console.log('\n[TEST 2] Testing Italic...');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('This is italic text');
    await page.waitForTimeout(500);
    
    // Select "italic"
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await page.waitForTimeout(500);
    
    // Click Italic button
    await page.locator('button[title="Italic"]').click();
    await page.waitForTimeout(1000);
    
    // Check HTML
    html = await editor.innerHTML();
    console.log('HTML after Italic:', html);
    const italicSuccess = html.includes('<em>') || html.includes('<i>');
    console.log('Italic result:', italicSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Clear and test Underline
    console.log('\n[TEST 3] Testing Underline...');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Underline this');
    await page.waitForTimeout(500);
    
    // Select all
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(500);
    
    // Click Underline button
    await page.locator('button[title="Underline"]').click();
    await page.waitForTimeout(1000);
    
    // Check HTML
    html = await editor.innerHTML();
    console.log('HTML after Underline:', html);
    const underlineSuccess = html.includes('<u>');
    console.log('Underline result:', underlineSuccess ? '✓ SUCCESS' : '✗ FAILED');
    
    // Test results summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Bold:', boldSuccess ? '✓ PASSED' : '✗ FAILED');
    console.log('Italic:', italicSuccess ? '✓ PASSED' : '✗ FAILED');
    console.log('Underline:', underlineSuccess ? '✓ PASSED' : '✗ FAILED');
    
    const totalTests = 3;
    const passedTests = (boldSuccess ? 1 : 0) + (italicSuccess ? 1 : 0) + (underlineSuccess ? 1 : 0);
    console.log('\nTotal Tests:', totalTests);
    console.log('Passed:', passedTests);
    console.log('Failed:', totalTests - passedTests);
    console.log('Success Rate:', Math.round((passedTests / totalTests) * 100) + '%');
  } else {
    console.log('ERROR: Toolbar did not appear when text was selected');
  }
  
  console.log('\nTest complete. Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();