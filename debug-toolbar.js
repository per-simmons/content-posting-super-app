// Debug script to check toolbar functionality
// Run this in your browser console on the /lex page

console.log('=== TOOLBAR DEBUG SCRIPT ===');

// 1. Check if components are loaded
const checkComponents = () => {
  const editor = document.querySelector('[contenteditable="true"]');
  const toolbar = document.querySelector('[role="toolbar"]');
  
  console.log('1. Component Check:');
  console.log('   Editor found:', !!editor);
  console.log('   Toolbar found:', !!toolbar);
  
  if (editor) {
    console.log('   Editor classes:', editor.className);
    console.log('   Editor content:', editor.innerHTML);
  }
  
  if (toolbar) {
    console.log('   Toolbar visible:', toolbar.offsetParent !== null);
    console.log('   Toolbar buttons:', toolbar.querySelectorAll('button').length);
  }
  
  return { editor, toolbar };
};

// 2. Test selection
const testSelection = () => {
  console.log('\n2. Selection Test:');
  const editor = document.querySelector('[contenteditable="true"]');
  
  if (!editor) {
    console.log('   ERROR: No editor found');
    return;
  }
  
  // Add test text
  editor.innerHTML = 'Testing toolbar selection';
  editor.focus();
  
  // Create selection
  const selection = window.getSelection();
  const range = document.createRange();
  const textNode = editor.firstChild;
  
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    range.setStart(textNode, 8); // Select "toolbar"
    range.setEnd(textNode, 15);
    selection.removeAllRanges();
    selection.addRange(range);
    
    console.log('   Selected text:', selection.toString());
    
    // Trigger events
    document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
    document.dispatchEvent(new Event('mouseup', { bubbles: true }));
    
    // Check toolbar visibility
    setTimeout(() => {
      const toolbar = document.querySelector('[role="toolbar"]');
      console.log('   Toolbar visible after selection:', toolbar && toolbar.offsetParent !== null);
      
      if (toolbar && toolbar.offsetParent !== null) {
        console.log('   ✅ Toolbar appears on selection');
      } else {
        console.log('   ❌ Toolbar NOT appearing');
      }
    }, 100);
  }
};

// 3. Test formatting
const testFormatting = () => {
  console.log('\n3. Formatting Test:');
  
  setTimeout(() => {
    const boldButton = document.querySelector('button[title="Bold"]');
    
    if (boldButton) {
      console.log('   Bold button found');
      
      // Save current selection
      const sel = window.getSelection();
      const savedRange = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
      
      // Click bold button
      boldButton.click();
      
      setTimeout(() => {
        const editor = document.querySelector('[contenteditable="true"]');
        console.log('   Editor HTML after bold:', editor.innerHTML);
        
        const hasBold = editor.innerHTML.includes('<b>') || 
                       editor.innerHTML.includes('<strong>');
        
        if (hasBold) {
          console.log('   ✅ Bold formatting applied');
        } else {
          console.log('   ❌ Bold formatting NOT applied');
        }
      }, 100);
    } else {
      console.log('   ❌ Bold button not found');
    }
  }, 200);
};

// 4. Check React components
const checkReact = () => {
  console.log('\n4. React Component Check:');
  
  // Try to find React fiber
  const editor = document.querySelector('[contenteditable="true"]');
  if (editor) {
    const reactKey = Object.keys(editor).find(key => key.startsWith('__react'));
    console.log('   React attached to editor:', !!reactKey);
  }
  
  // Check for React DevTools
  console.log('   React DevTools available:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined');
};

// 5. Test execCommand
const testExecCommand = () => {
  console.log('\n5. execCommand Test:');
  
  const editor = document.querySelector('[contenteditable="true"]');
  if (!editor) {
    console.log('   ERROR: No editor found');
    return;
  }
  
  editor.innerHTML = 'Test execCommand';
  editor.focus();
  
  // Select all
  document.execCommand('selectAll');
  
  // Try bold
  const result = document.execCommand('bold', false, null);
  console.log('   execCommand("bold") result:', result);
  console.log('   HTML after:', editor.innerHTML);
  
  if (editor.innerHTML.includes('<b>') || editor.innerHTML.includes('<strong>')) {
    console.log('   ✅ execCommand works');
  } else {
    console.log('   ❌ execCommand not working');
  }
};

// Run all tests
console.log('\nRunning all tests...\n');

checkComponents();
testSelection();

setTimeout(() => {
  testFormatting();
  
  setTimeout(() => {
    checkReact();
    testExecCommand();
    
    console.log('\n=== END DEBUG SCRIPT ===');
    console.log('If toolbar is not working, check:');
    console.log('1. Browser console for errors');
    console.log('2. Network tab for failed resource loads');
    console.log('3. Try hard refresh (Cmd+Shift+R)');
    console.log('4. Try incognito/private mode');
  }, 500);
}, 300);