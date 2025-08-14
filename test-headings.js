const { chromium } = require('playwright');

(async () => {
  console.log('Testing heading dropdown functionality...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
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
  
  // Check title input is bold
  const titleInput = await page.locator('input[placeholder="Title..."]');
  if (await titleInput.count() > 0) {
    const titleClasses = await titleInput.getAttribute('class');
    console.log(`✓ Title input classes: ${titleClasses}`);
    const isBold = titleClasses.includes('font-bold');
    console.log(`✓ Title input is bold: ${isBold}`);
    
    await titleInput.type('Test Heading Document');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  }
  
  // Type text in the editor
  const editor = await page.locator('[contenteditable="true"]');
  await editor.click();
  await page.keyboard.type('This is normal text');
  await page.keyboard.press('Enter');
  await page.keyboard.type('This will be a heading');
  await page.waitForTimeout(500);
  
  // Select the second line
  await page.keyboard.press('Meta+A');
  await page.waitForTimeout(1000);
  
  // Check if toolbar is visible
  const toolbar = await page.locator('[role="toolbar"]');
  const toolbarVisible = await toolbar.isVisible();
  console.log(`\n✓ Toolbar visible: ${toolbarVisible}`);
  
  if (toolbarVisible) {
    // Click on heading dropdown
    const headingDropdown = await page.locator('button:has-text("Normal")').first();
    if (await headingDropdown.isVisible()) {
      console.log('✓ Heading dropdown button found');
      await headingDropdown.click();
      await page.waitForTimeout(500);
      
      // Check if dropdown menu is visible
      const h2Option = await page.locator('button:has-text("Heading 2")');
      if (await h2Option.isVisible()) {
        console.log('✓ Dropdown menu opened');
        
        // Click on H2
        await h2Option.click();
        await page.waitForTimeout(1000);
        
        // Check if heading was applied
        const editorHTML = await editor.innerHTML();
        console.log('\nEditor HTML after H2:');
        console.log(editorHTML);
        
        const hasH2 = editorHTML.includes('<h2>') || editorHTML.includes('</h2>');
        console.log(`\n✓ H2 formatting applied: ${hasH2}`);
        
        if (hasH2) {
          console.log('✅ SUCCESS: Heading dropdown is working correctly!');
        } else {
          console.log('❌ ISSUE: Heading was not applied');
        }
      } else {
        console.log('❌ Dropdown menu did not open');
      }
    }
  }
  
  console.log('\n✓ Test complete. Browser will remain open for 30 seconds.');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();