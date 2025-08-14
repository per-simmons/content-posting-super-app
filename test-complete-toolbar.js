const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('='.repeat(60));
  console.log('COMPLETE TOOLBAR FUNCTIONALITY TEST');
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
  
  // Test results tracker
  const results = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    heading: false,
    blockquote: false,
    link: false,
    code: false,
    subscript: false,
    superscript: false,
    clearFormatting: false
  };
  
  // Test 1: Bold
  console.log('\n[TEST 1] Testing Bold...');
  await page.keyboard.type('test bold ');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  let toolbar = await page.locator('[role="toolbar"]');
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Bold"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.bold = html.includes('<strong>') || html.includes('<b>');
    console.log('Bold result:', results.bold ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Clear and test Italic
  console.log('\n[TEST 2] Testing Italic...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('test italic ');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Italic"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.italic = html.includes('<em>') || html.includes('<i>');
    console.log('Italic result:', results.italic ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Underline
  console.log('\n[TEST 3] Testing Underline...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('test underline ');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Underline"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.underline = html.includes('<u>');
    console.log('Underline result:', results.underline ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Strikethrough
  console.log('\n[TEST 4] Testing Strikethrough...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('test strike ');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Strikethrough"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.strikethrough = html.includes('<s>') || html.includes('<strike>');
    console.log('Strikethrough result:', results.strikethrough ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Heading
  console.log('\n[TEST 5] Testing Heading...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('Test Heading');
  await page.keyboard.press('Meta+A');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    // Click the heading dropdown
    const headingDropdown = await page.locator('button:has-text("Normal")');
    await headingDropdown.click();
    await page.waitForTimeout(500);
    
    // Select H2
    const h2Option = await page.locator('button:has-text("Heading 2")');
    if (await h2Option.isVisible()) {
      await h2Option.click();
      await page.waitForTimeout(500);
      let html = await editor.innerHTML();
      results.heading = html.includes('<h2>') || html.includes('<H2>');
      console.log('Heading result:', results.heading ? '✓ SUCCESS' : '✗ FAILED');
      console.log('HTML:', html);
    }
  }
  
  // Test Block Quote
  console.log('\n[TEST 6] Testing Block Quote...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('This is a quote');
  await page.keyboard.press('Meta+A');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Block Quote"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.blockquote = html.includes('<blockquote>');
    console.log('Block Quote result:', results.blockquote ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Inline Code
  console.log('\n[TEST 7] Testing Inline Code...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('test code ');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Insert Code"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.code = html.includes('<code>');
    console.log('Code result:', results.code ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Subscript
  console.log('\n[TEST 8] Testing Subscript...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('H2O');
  // Select just the "2"
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Subscript"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.subscript = html.includes('<sub>');
    console.log('Subscript result:', results.subscript ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Superscript
  console.log('\n[TEST 9] Testing Superscript...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('x2');
  // Select just the "2"
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Superscript"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.superscript = html.includes('<sup>');
    console.log('Superscript result:', results.superscript ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Test Clear Formatting
  console.log('\n[TEST 10] Testing Clear Formatting...');
  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('formatted text');
  await page.keyboard.press('Meta+A');
  await page.waitForTimeout(500);
  
  // First apply bold
  if (await toolbar.isVisible()) {
    await page.locator('button[title="Bold"]').click();
    await page.waitForTimeout(500);
    
    // Then select again and clear
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(500);
    
    await page.locator('button[title="Clear Formatting"]').click();
    await page.waitForTimeout(500);
    let html = await editor.innerHTML();
    results.clearFormatting = !html.includes('<strong>') && !html.includes('<b>');
    console.log('Clear Formatting result:', results.clearFormatting ? '✓ SUCCESS' : '✗ FAILED');
    console.log('HTML:', html);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${test.padEnd(20)} : ${passed ? '✓ PASSED' : '✗ FAILED'}`);
    if (passed) passedCount++;
    else failedCount++;
  }
  
  console.log('\n' + '-'.repeat(40));
  console.log(`Total Tests: ${passedCount + failedCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Success Rate: ${Math.round((passedCount / (passedCount + failedCount)) * 100)}%`);
  console.log('='.repeat(60));
  
  if (failedCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The toolbar is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.');
  }
  
  console.log('\nTest complete. Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();