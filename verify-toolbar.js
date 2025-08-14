const { chromium } = require('playwright');

(async () => {
  console.log('Starting toolbar verification test...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the app
  await page.goto('http://localhost:3000/lex');
  console.log('✓ Navigated to /lex page');
  await page.waitForTimeout(2000);
  
  // Click on title to start editing
  const titleExists = await page.locator('h1:has-text("Title...")').count();
  if (titleExists) {
    await page.click('h1:has-text("Title...")');
    console.log('✓ Clicked on title placeholder');
    await page.waitForTimeout(500);
  }
  
  // Type a title
  const titleInput = await page.locator('input[placeholder="Title..."]');
  if (await titleInput.count() > 0) {
    await titleInput.type('Test Document');
    console.log('✓ Typed title: "Test Document"');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  }
  
  // Type text in the editor
  const editor = await page.locator('[contenteditable="true"]');
  await editor.click();
  await page.keyboard.type('This text should be formatted');
  console.log('✓ Typed text: "This text should be formatted"');
  await page.waitForTimeout(1000);
  
  // Select all text
  await page.keyboard.press('Meta+A');
  await page.waitForTimeout(1000);
  
  // Check if toolbar is visible
  const toolbar = await page.locator('[role="toolbar"]');
  const toolbarVisible = await toolbar.isVisible();
  console.log(`✓ Toolbar visible: ${toolbarVisible}`);
  
  if (toolbarVisible) {
    console.log('\nFormatting Test Results:');
    console.log('========================');
    
    // Test Bold
    const boldButton = await page.locator('button[title="Bold"]');
    if (await boldButton.isVisible()) {
      await boldButton.click();
      await page.waitForTimeout(500);
      
      const htmlAfterBold = await editor.innerHTML();
      const hasBold = htmlAfterBold.includes('<b>') || htmlAfterBold.includes('<strong>');
      console.log(`Bold: ${hasBold ? '✓ Working' : '✗ Not working'}`);
      
      if (hasBold) {
        console.log(`  Applied: ${htmlAfterBold.substring(0, 100)}...`);
      }
    }
    
    // Select text again
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(500);
    
    // Test Italic
    const italicButton = await page.locator('button[title="Italic"]');
    if (await italicButton.isVisible()) {
      await italicButton.click();
      await page.waitForTimeout(500);
      
      const htmlAfterItalic = await editor.innerHTML();
      const hasItalic = htmlAfterItalic.includes('<i>') || htmlAfterItalic.includes('<em>');
      console.log(`Italic: ${hasItalic ? '✓ Working' : '✗ Not working'}`);
      
      if (hasItalic) {
        console.log(`  Applied: ${htmlAfterItalic.substring(0, 100)}...`);
      }
    }
    
    // Select text again
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(500);
    
    // Test Underline
    const underlineButton = await page.locator('button[title="Underline"]');
    if (await underlineButton.isVisible()) {
      await underlineButton.click();
      await page.waitForTimeout(500);
      
      const htmlAfterUnderline = await editor.innerHTML();
      const hasUnderline = htmlAfterUnderline.includes('<u>') || htmlAfterUnderline.includes('text-decoration');
      console.log(`Underline: ${hasUnderline ? '✓ Working' : '✗ Not working'}`);
      
      if (hasUnderline) {
        console.log(`  Applied: ${htmlAfterUnderline.substring(0, 100)}...`);
      }
    }
    
    // Final check - get the actual text content
    const finalText = await editor.textContent();
    console.log(`\nFinal text content: "${finalText}"`);
    
    // Check if text is reversed
    if (finalText === 'detamrof eb dluohs txet sihT' || finalText.split('').reverse().join('') === 'This text should be formatted') {
      console.log('⚠️  WARNING: Text appears to be reversed!');
    } else {
      console.log('✓ Text direction is correct');
    }
    
  } else {
    console.log('\n✗ Toolbar did not appear - this needs to be fixed');
  }
  
  console.log('\n✓ Test complete. Browser will remain open for manual inspection.');
  console.log('You can manually test the toolbar buttons to verify they work correctly.');
  
  // Keep browser open for manual testing
  await page.waitForTimeout(60000);
  
  await browser.close();
})();