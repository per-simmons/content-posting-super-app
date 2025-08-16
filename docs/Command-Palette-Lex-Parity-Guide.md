# Command Palette Lex Parity Implementation Guide

## Overview
Complete implementation guide for achieving pixel-perfect Lex.page command palette parity, solving "random bottom placement" and "everything blue" issues.

---

## 1. Positioning System (Anchor to Selected Word)

### Problem
Palette appears at random bottom locations instead of anchoring to the caret/selection.

### Solution Implementation

```typescript
// InlineCommandPalette.tsx positioning logic
useEffect(() => {
  if (containerRef.current) {
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    // Calculate position relative to caret/selection
    let adjustedX = position.x
    let adjustedY = position.y + 16 // 16px gap below caret
    let pointerPosition = 'bottom' // pointer position relative to palette
    
    // Viewport edge detection
    if (adjustedX + rect.width > viewportWidth - 20) {
      adjustedX = viewportWidth - rect.width - 20
    }
    
    // Flip above if not enough space below
    if (adjustedY + rect.height > viewportHeight - 20) {
      adjustedY = position.y - rect.height - 16 // 16px gap above caret
      pointerPosition = 'top'
    }
    
    // Apply positioning
    container.style.left = `${adjustedX}px`
    container.style.top = `${adjustedY}px`
    
    // Dynamic pointer positioning
    if (pointerPosition === 'bottom') {
      container.style.setProperty('--pointer-top', '-4px')
      container.style.setProperty('--pointer-left', `${Math.min(Math.max(position.x - adjustedX - 4, 8), rect.width - 16)}px`)
      container.style.setProperty('--pointer-transform', 'rotate(45deg)')
    } else {
      container.style.setProperty('--pointer-top', `${rect.height - 4}px`)
      container.style.setProperty('--pointer-left', `${Math.min(Math.max(position.x - adjustedX - 4, 8), rect.width - 16)}px`)
      container.style.setProperty('--pointer-transform', 'rotate(225deg)')
    }
  }
}, [position])
```

### Pointer CSS Implementation

```css
/* CommandPalette.css */
.cp-palette {
  position: relative;
}

.cp-palette::after {
  content: '';
  position: absolute;
  top: var(--pointer-top, -4px);
  left: var(--pointer-left, 20px);
  width: 8px;
  height: 8px;
  background: var(--cp-bg);
  border: 1px solid var(--cp-border);
  border-right: none;
  border-bottom: none;
  transform: var(--pointer-transform, rotate(45deg));
  z-index: -1;
}
```

---

## 2. Visual Theme (Stop Defaulting to Blue)

### Problem
Entire palette reads navy/blue instead of neutral graphite. Selected rows show solid blue bars.

### Root Cause
Using brand accent colors for surfaces and active states instead of neutral washes.

### Design Token Solution

```css
/* CommandPalette.css - Complete token system */
:root {
  --cp-bg: #151922;                   /* panel surface - neutral graphite */
  --cp-border: #262A33;
  --cp-shadow: 0 12px 28px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.35);
  --row-hover: rgba(255,255,255,.06); /* neutral hover wash */
  --row-active: rgba(47,129,247,.14); /* subtle blue wash, NOT solid */
  --text: #CFD6E4; 
  --text-strong: #EDEFF3; 
  --muted: #9FA8BA;
  --blue: #2F81F7;                    /* reserved for icons and Submit chip */
  --chip-gray-bg: rgba(255,255,255,.12);
  --chip-gray-fg: #DDE3ED;
}
```

### Panel Styling

```css
.cp-palette {
  width: 420px; 
  max-height: 420px; 
  overflow: hidden;
  background: var(--cp-bg);           /* neutral, not blue */
  border: 1px solid var(--cp-border);
  border-radius: 12px; 
  box-shadow: var(--cp-shadow);
}
```

### Row State Implementation

```css
.cp-row {
  height: 40px; 
  padding: 8px 12px; 
  border-radius: 8px; 
  display: flex; 
  align-items: center; 
  gap: 12px;
  transition: background-color 0.15s ease;
}

/* NO solid blue bars - use translucent washes */
.cp-row:hover {
  background: var(--row-hover);       /* neutral hover */
}

.cp-row[aria-selected="true"] {
  background: var(--row-active);      /* subtle blue wash */
}
```

---

## 3. Layout & Typography (Exact Lex Match)

### Specifications

```css
/* Search Row */
.cp-search {
  height: 40px; 
  padding: 8px 12px; 
  border-bottom: 1px solid var(--cp-border); /* hairline divider */
}

.cp-input {
  flex: 1;
  background: rgba(255,255,255,.06);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-strong);
  caret-color: var(--blue);
  border: none;
  outline: none;
  transition: background-color 0.15s ease;
}

.cp-input:focus {
  background: rgba(255,255,255,.10);
}

.cp-input::placeholder {
  color: var(--muted);
}
```

### Row Layout System

```css
.cp-ico {
  flex: 0 0 24px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  opacity: 0.8;
}

.cp-ico svg {
  width: 18px; 
  height: 18px; 
  stroke-width: 1.75;
  vector-effect: non-scaling-stroke;
}

.cp-label {
  flex: 1 1 auto; 
  min-width: 0; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  font: 500 16px/24px Inter, system-ui;
  color: var(--text-strong);
}

.cp-chip, .cp-chevron {
  flex: 0 0 auto; 
  white-space: nowrap;
}
```

---

## 4. Icon System (Set, Color, Order)

### Icon Configuration

All icons must use:
- **Library**: lucide-react only
- **Size**: 18px
- **Stroke**: 1.75
- **Vector Effect**: non-scaling-stroke

### Color Rules

```typescript
// Icon color logic in component
const iconColor = cmd.category === 'ai' ? '#2F81F7' : 'rgba(255, 255, 255, 0.8)'

<Icon 
  size={18} 
  strokeWidth={1.75} 
  vectorEffect="non-scaling-stroke"
  style={{ color: iconColor }}
/>
```

### Required Order & Icons

```typescript
const commands: Command[] = [
  { id: 'edit', label: 'Edit selected text', icon: PencilLine, category: 'ai' },
  { id: 'check', label: 'Run checks', icon: ListChecks, category: 'ai' },
  { id: 'chat', label: 'Chat about your document', icon: MessageSquarePlus, shortcut: '⌘\\', category: 'ai' },
  { id: 'continue', label: 'Continue writing', icon: Plus, shortcut: '+++', category: 'ai' },
  // Divider after continue (implemented in render logic)
  { id: 'image', label: 'Insert image', icon: ImagePlus },
  { id: 'format', label: 'Format', icon: CaseSensitive, hasSubmenu: true },
  { id: 'copy', label: 'Copy selected text as...', icon: Copy },
  { id: 'view', label: 'View options', icon: Eye },
  { id: 'history', label: 'History', icon: History },
  { id: 'switch', label: 'Switch document', icon: Files, shortcut: '⌘P' }
]
```

---

## 5. Chip System Implementation

### Chip Types & Colors

```css
.cp-chip {
  font: 600 12px/18px Inter, system-ui;
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}

.cp-chip.gray {
  background: var(--chip-gray-bg);    /* rgba(255,255,255,.12) */
  color: var(--chip-gray-fg);         /* #DDE3ED */
}

.cp-chip.blue {
  background: var(--blue);            /* #2F81F7 */
  color: #fff;
}
```

### Chip Logic

```typescript
// In render logic
<div className="flex items-center gap-2 ml-auto">
  {cmd.shortcut && (
    <span className="cp-chip gray">
      {cmd.shortcut}
    </span>
  )}
  {selectedIndex === index && cmd.id === 'edit' && (
    <span className="cp-chip blue">
      ↵ Submit
    </span>
  )}
</div>
```

**Rules:**
- Gray chips: static shortcuts (⌘\\, +++, ⌘P)
- Blue chips: ONLY "↵ Submit" when Edit row is focused
- Right-aligned, single line, no wrapping

---

## 6. Search Bar + Mic Implementation

```typescript
// Search row JSX
<div className="flex items-center" style={{
  height: '40px',
  padding: '8px 12px',
  borderBottom: '1px solid #262A33'
}}>
  <input
    ref={inputRef}
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Type a command..."
    className="flex-1 outline-none text-sm transition-colors"
    style={{
      background: 'rgba(255,255,255,.06)',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#EDEFF3',
      caretColor: '#2F81F7',
      border: 'none'
    }}
    onFocus={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,.10)'
    }}
    onBlur={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,.06)'
    }}
  />
  <button className="ml-2 p-1.5 rounded-md transition-all" style={{
    color: 'rgba(255, 255, 255, 0.8)',
    opacity: 0.8
  }}>
    <Mic size={18} strokeWidth={1.75} />
  </button>
</div>
```

---

## 7. Visual Hierarchy (Dividers)

### Divider Implementation

```css
.cp-divider {
  height: 1px;
  background: var(--cp-border);
  margin: 8px 12px;
}
```

```typescript
// In render logic after Continue writing command
{cmd.id === 'continue' && (
  <div className="cp-divider"></div>
)}
```

This separates AI commands (Edit, Run checks, Chat, Continue) from utility commands.

---

## 8. Common Blue Theme Fixes

### What to Remove/Replace

```css
/* REMOVE these blue defaults: */
.cp-row[aria-selected="true"] { 
  background: blue; /* ❌ NO solid blue */
}

#cmdk { 
  background: var(--blue-900); /* ❌ NO blue surface */
}

.cp-search { 
  background: var(--accent-bg); /* ❌ NO accent surface */
}
```

```css
/* REPLACE with neutral tokens: */
.cp-row[aria-selected="true"] { 
  background: var(--row-active); /* ✅ subtle blue wash */
}

#cmdk { 
  background: var(--cp-bg); /* ✅ neutral graphite */
}

.cp-search { 
  background: transparent; /* ✅ or inherit from parent */
}
```

### Blue Usage Rules

**✅ Blue is ONLY for:**
- AI command icons (#2F81F7)
- "↵ Submit" chip background
- Input caret color

**❌ Blue is NEVER for:**
- Panel background
- Row backgrounds (even selected)
- Search bar background
- Border colors

---

## 9. Implementation Checklist

- [ ] Position anchors to caret with centered pointer
- [ ] Panel uses graphite theme (#151922) with 12px radius
- [ ] Width exactly 420px, max-height 420px
- [ ] Row order matches Lex exactly (Edit → Run → Chat → Continue → divider → utilities)
- [ ] All icons are lucide-react, 18px, 1.75 stroke
- [ ] Hover uses neutral wash, active uses subtle blue wash
- [ ] Chips right-aligned: gray for shortcuts, blue only for Submit on focused Edit
- [ ] Search row 40px with hairline divider
- [ ] Mic icon present with proper styling
- [ ] Typography matches: 16/24 labels, 12/18 chips
- [ ] No solid blue bars anywhere
- [ ] Smooth keyboard navigation
- [ ] Proper accessibility maintained

---

## 10. File Structure

```
/app/lex/components/CommandPalette/
├── InlineCommandPalette.tsx     # Main component with all logic
├── CommandPalette.css          # Design tokens and styling
└── CommandPalette.tsx          # Legacy modal version (unused)
```

### CSS Import

```typescript
// InlineCommandPalette.tsx
import './CommandPalette.css'  // ✅ Regular CSS (not .module.css)
```

---

This implementation guide ensures complete Lex.page parity while solving the core positioning and visual theme issues.