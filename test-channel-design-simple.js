const { chromium } = require('playwright');

(async () => {
  let browser, page;
  
  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    const filePath = 'file://' + __dirname + '/test-channel-selector.html';
    console.log('Opening test page:', filePath);
    
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'channel-design-isolated.png', fullPage: true });
    console.log('Screenshot saved as channel-design-isolated.png');
    
    // Get computed styles for each channel type
    const channels = ['auto', 'youtube', 'linkedin', 'twitter', 'newsletter', 'blog'];
    
    for (const channel of channels) {
      const chip = page.locator(`.channel--${channel}`).first();
      const styles = await chip.evaluate(el => {
        const computedStyles = window.getComputedStyle(el);
        return {
          background: computedStyles.background,
          backgroundColor: computedStyles.backgroundColor,
          borderRadius: computedStyles.borderRadius,
          padding: computedStyles.padding,
          height: computedStyles.height,
          fontSize: computedStyles.fontSize,
          fontWeight: computedStyles.fontWeight,
          textShadow: computedStyles.textShadow,
          boxShadow: computedStyles.boxShadow
        };
      });
      
      console.log(`\n${channel.toUpperCase()} CHANNEL STYLES:`);
      console.log(JSON.stringify(styles, null, 2));
    }
    
    console.log('\n=== DESIGN ANALYSIS COMPLETE ===');
    console.log('Visual inspection shows current channel selector styling.');
    console.log('Check channel-design-isolated.png for visual assessment.');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();