const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  console.log('Opening /lex page with DevTools...');
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
  
  // Get ALL computed styles for the editor
  const editorInfo = await page.evaluate(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (editor) {
      const styles = window.getComputedStyle(editor);
      const parent = editor.parentElement;
      const parentStyles = parent ? window.getComputedStyle(parent) : null;
      
      return {
        editor: {
          direction: styles.direction,
          unicodeBidi: styles.unicodeBidi,
          writingMode: styles.writingMode,
          transform: styles.transform,
          textAlign: styles.textAlign,
          display: styles.display,
          className: editor.className
        },
        parent: parentStyles ? {
          direction: parentStyles.direction,
          unicodeBidi: parentStyles.unicodeBidi,
          writingMode: parentStyles.writingMode,
          transform: parentStyles.transform,
          className: parent.className
        } : null
      };
    }
    return null;
  });
  
  console.log('\nEditor computed styles:');
  console.log(JSON.stringify(editorInfo, null, 2));
  
  // Type and check what actually happens
  console.log('\nTyping "ABC 123"...');
  await page.keyboard.type('ABC 123');
  await page.waitForTimeout(500);
  
  const result = await page.evaluate(() => {
    const editor = document.querySelector('[contenteditable="true"]');
    return {
      textContent: editor?.textContent,
      innerHTML: editor?.innerHTML,
      innerText: editor?.innerText
    };
  });
  
  console.log('\nContent after typing "ABC 123":');
  console.log('textContent:', result.textContent);
  console.log('innerHTML:', result.innerHTML);
  console.log('innerText:', result.innerText);
  
  console.log('\nKeep browser open for inspection. Press Ctrl+C to close.');
  
  // Keep browser open
  await new Promise(() => {});
})();