const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to /lex page...');
  await page.goto('http://localhost:3000/lex');
  await page.waitForTimeout(2000);
  
  // Check if we have the title placeholder or input
  const titlePlaceholder = await page.locator('h1:has-text("Title...")').count();
  if (titlePlaceholder > 0) {
    console.log('Clicking title area...');
    await page.click('h1:has-text("Title...")');
    await page.waitForTimeout(500);
  }
  
  // Type in the title field if it exists
  const titleInput = await page.locator('input[placeholder="Title..."]').count();
  if (titleInput > 0) {
    console.log('Typing title...');
    await page.type('input[placeholder="Title..."]', 'Test Document');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
  }
  
  // Type some text in the editor
  console.log('Typing in editor...');
  const editor = await page.locator('[contenteditable="true"]');
  await editor.click();
  await page.keyboard.type('This is some test text that we will format.');
  await page.waitForTimeout(500);
  
  // Select text by dragging
  console.log('Selecting text by dragging...');
  const boundingBox = await editor.boundingBox();
  await page.mouse.move(boundingBox.x + 10, boundingBox.y + 10);
  await page.mouse.down();
  await page.mouse.move(boundingBox.x + 100, boundingBox.y + 10);
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // Check selection
  const selectedText = await page.evaluate(() => window.getSelection().toString());
  console.log('Selected text:', selectedText);
  
  // Check if toolbar appears
  const toolbar = await page.locator('[role="toolbar"]');
  const isToolbarVisible = await toolbar.isVisible();
  console.log('Toolbar visible after selection:', isToolbarVisible);
  
  if (isToolbarVisible) {
    // Get initial HTML
    console.log('Initial editor HTML:');
    let editorHTML = await editor.innerHTML();
    console.log(editorHTML);
    
    // Try clicking the Bold button
    console.log('\nClicking Bold button...');
    const boldButton = await page.locator('button[title="Bold"]');
    
    // Check if button exists and is visible
    const boldButtonVisible = await boldButton.isVisible();
    console.log('Bold button visible:', boldButtonVisible);
    
    if (boldButtonVisible) {
      await boldButton.click();
      await page.waitForTimeout(1000);
      
      // Check if the text is now bold
      editorHTML = await editor.innerHTML();
      console.log('Editor HTML after Bold:');
      console.log(editorHTML);
      
      // Check if bold tags were added
      const hasBoldTags = editorHTML.includes('<b>') || editorHTML.includes('<strong>') || editorHTML.includes('font-weight');
      console.log('Bold formatting applied:', hasBoldTags);
    }
    
    // Select text again
    await page.mouse.move(boundingBox.x + 10, boundingBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(boundingBox.x + 100, boundingBox.y + 10);
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Try clicking Italic button
    console.log('\nClicking Italic button...');
    const italicButton = await page.locator('button[title="Italic"]');
    const italicButtonVisible = await italicButton.isVisible();
    console.log('Italic button visible:', italicButtonVisible);
    
    if (italicButtonVisible) {
      await italicButton.click();
      await page.waitForTimeout(1000);
      
      editorHTML = await editor.innerHTML();
      console.log('Editor HTML after Italic:');
      console.log(editorHTML);
      
      const hasItalicTags = editorHTML.includes('<i>') || editorHTML.includes('<em>') || editorHTML.includes('font-style');
      console.log('Italic formatting applied:', hasItalicTags);
    }
  }
  
  console.log('Test complete. Browser will remain open for inspection.');
  await page.waitForTimeout(30000); // Keep browser open for 30 seconds
  
  await browser.close();
})();