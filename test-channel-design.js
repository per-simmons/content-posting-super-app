const { chromium } = require('playwright');

(async () => {
  let browser, page;
  
  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    console.log('Navigating to http://localhost:3001/lex...');
    await page.goto('http://localhost:3001/lex');
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded successfully');
    
    // Take initial screenshot
    await page.screenshot({ path: 'initial-page.png', fullPage: true });
    console.log('Initial screenshot saved as initial-page.png');
    
    // Try typing in title to enter writing mode
    console.log('Typing in title editor...');
    const titleEditor = page.locator('[data-editor-type="title"]');
    await titleEditor.click();
    await titleEditor.fill('Test Title');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(2000);
    
    // Take screenshot after entering writing mode
    await page.screenshot({ path: 'writing-mode.png', fullPage: true });
    console.log('Writing mode screenshot saved');
    
    // Try keyboard shortcut in writing mode
    console.log('Trying ⌘E shortcut in writing mode...');
    await page.keyboard.press('Meta+e');
    
    await page.waitForTimeout(2000);
    
    // Check if voice panel appeared
    const voicePanel = page.locator('#chat-panel');
    const isPanelVisible = await voicePanel.isVisible();
    console.log('Voice panel visible:', isPanelVisible);
    
    if (isPanelVisible) {
      console.log('SUCCESS! Voice panel is open');
      
      // Take screenshot of the voice panel
      await page.screenshot({ path: 'voice-panel-open.png', fullPage: true });
      console.log('Screenshot saved as voice-panel-open.png');
      
      // Click on channel selector to open popover
      console.log('Clicking channel selector...');
      const channelSelector = page.locator('.channel--composer');
      await channelSelector.click();
      
      await page.waitForTimeout(1000);
      
      // Check if popover opened
      const popover = page.locator('.channel-pop');
      const isPopoverVisible = await popover.isVisible();
      console.log('Channel popover visible:', isPopoverVisible);
      
      if (isPopoverVisible) {
        console.log('SUCCESS! Channel popover is open');
        await page.screenshot({ path: 'channel-popover-open.png', fullPage: true });
        console.log('Screenshot saved as channel-popover-open.png');
        
        // Get styles of Auto chip
        const autoChip = page.locator('.channel--auto').first();
        const autoStyles = await autoChip.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            background: styles.background,
            borderRadius: styles.borderRadius,
            padding: styles.padding,
            height: styles.height,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          };
        });
        
        console.log('Auto chip styles:', autoStyles);
      }
    } else {
      console.log('FAILED: Voice panel did not open');
      await page.screenshot({ path: 'failed-no-panel.png', fullPage: true });
      console.log('Failure screenshot saved as failed-no-panel.png');
    }
    
    console.log('\n=== DESIGN INSPECTION COMPLETE ===');
    console.log('Check the screenshots to see the current design state.');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    if (page) {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('Error screenshot saved');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();