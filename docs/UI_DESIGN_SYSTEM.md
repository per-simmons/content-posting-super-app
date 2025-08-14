# Content Posting Super App - UI Design System

## Overview
This document defines the comprehensive UI design system for the Content Posting Super App - a multi-modal content creation platform supporting long-form video, short-form content, text posts, blogs, and newsletters. The system prioritizes consistency, clarity, and professional aesthetics with support for both light and dark modes.

## Core Design Principles

### 1. Visual Hierarchy
- **Clear information architecture** with distinct sections and navigation patterns
- **Progressive disclosure** for complex features (modals, multi-step workflows)
- **Contextual grouping** of related actions and content

### 2. User Experience
- **Responsive design** optimized for desktop with mobile considerations
- **Keyboard accessibility** with proper focus management
- **Smooth transitions** for state changes and interactions
- **Consistent feedback patterns** for user actions

### 3. Brand Personality
- **Professional** yet approachable interface
- **Modern** aesthetic with clean lines and thoughtful spacing
- **Content-first** approach minimizing UI chrome

## Color System

### Light Mode Palette
```css
/* Backgrounds */
--bg-primary: white (#ffffff)
--bg-secondary: neutral-50 (#fafafa)
--bg-tertiary: neutral-100 (#f5f5f5)
--bg-overlay: neutral-900/20 (rgba(23, 23, 23, 0.2))

/* Text */
--text-primary: neutral-900 (#171717)
--text-secondary: neutral-600 (#525252)
--text-muted: neutral-400 (#a3a3a3)

/* Borders */
--border-default: neutral-200 (#e5e5e5)
--border-emphasis: neutral-300 (#d4d4d4)
--border-subtle: neutral-100 (#f5f5f5)

/* Interactive States */
--hover-bg: neutral-50 (#fafafa)
--active-bg: neutral-100 (#f5f5f5)
--focus-ring: blue-500 (#3b82f6)
```

### Dark Mode Palette
```css
/* Backgrounds */
--bg-primary: neutral-950 (#0a0a0a)
--bg-secondary: neutral-900 (#171717)
--bg-tertiary: neutral-800 (#262626)
--bg-overlay: black/60 (rgba(0, 0, 0, 0.6))

/* Text */
--text-primary: white (#ffffff)
--text-secondary: neutral-200 (#e5e5e5)
--text-muted: neutral-400 (#a3a3a3)

/* Borders */
--border-default: neutral-800 (#262626)
--border-emphasis: neutral-700 (#404040)
--border-subtle: neutral-900 (#171717)

/* Interactive States */
--hover-bg: neutral-900/60 (rgba(23, 23, 23, 0.6))
--active-bg: neutral-800 (#262626)
--focus-ring: blue-400 (#60a5fa)
```

### Semantic Colors
```css
/* Success */
--success: emerald-500 (#10b981)
--success-bg: emerald-500/10
--success-border: emerald-500/20

/* Warning */
--warning: amber-500 (#f59e0b)
--warning-bg: amber-500/10
--warning-border: amber-500/20

/* Error */
--error: red-500 (#ef4444)
--error-bg: red-500/10
--error-border: red-500/20

/* Info */
--info: blue-500 (#3b82f6)
--info-bg: blue-500/10
--info-border: blue-500/20
```

## Typography

### Font Stack
```css
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
--font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace
```

### Type Scale
```css
/* Headings */
--text-2xl: 1.5rem (24px) - line-height: 2rem
--text-xl: 1.25rem (20px) - line-height: 1.75rem
--text-lg: 1.125rem (18px) - line-height: 1.75rem
--text-base: 1rem (16px) - line-height: 1.5rem

/* Body Text */
--text-sm: 0.875rem (14px) - line-height: 1.25rem
--text-xs: 0.75rem (12px) - line-height: 1rem
--text-[13px]: 0.8125rem (13px) - line-height: 1.125rem
--text-[11px]: 0.6875rem (11px) - line-height: 1rem

/* Font Weights */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Text Utilities
- **Tracking**: `tracking-tight` (-0.025em), `tracking-wide` (0.025em)
- **Truncation**: `truncate` for single-line ellipsis
- **Wrapping**: `whitespace-pre-wrap` for preserving formatting
- **Case**: `uppercase` for section headers

## Spacing System

### Base Unit: 4px (0.25rem)
```css
/* Padding/Margin Scale */
--space-0: 0
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem (48px)
```

### Common Spacing Patterns
- **Card padding**: `p-4` (16px) mobile, `p-5` (20px) desktop
- **Section spacing**: `space-y-4` (16px vertical gap)
- **Inline spacing**: `gap-2` (8px) for icons/text, `gap-3` (12px) for larger elements
- **Modal padding**: `px-4 py-3` for headers, `p-4` or `p-5` for content

## Layout Components

### Container Widths
```css
--max-w-sm: 24rem (384px)
--max-w-md: 28rem (448px)
--max-w-lg: 32rem (512px)
--max-w-xl: 36rem (576px)
--max-w-2xl: 42rem (672px)
--max-w-3xl: 48rem (768px)
--max-w-4xl: 56rem (896px)
--max-w-5xl: 64rem (1024px)
```

### Grid Systems
- **Two-column**: `grid-cols-1 md:grid-cols-2`
- **Three-column**: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- **Gap spacing**: `gap-3` (12px) standard, `gap-4` (16px) for larger layouts

### Flex Patterns
- **Center aligned**: `flex items-center justify-center`
- **Space between**: `flex items-center justify-between`
- **Inline elements**: `inline-flex items-center gap-2`

## Component Patterns

### Buttons

#### Primary Button
```jsx
className="rounded-lg px-3.5 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
```

#### Secondary Button
```jsx
className="rounded-lg px-3.5 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
```

#### Ghost Button
```jsx
className="text-sm opacity-80 hover:opacity-100 cursor-pointer"
```

#### Icon Button
```jsx
className="inline-flex h-8 w-8 items-center justify-center rounded opacity-70 hover:opacity-100"
```

### Cards

#### Standard Card
```jsx
className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4"
```

#### Interactive Card
```jsx
className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 cursor-pointer"
```

#### Card with Header
```jsx
<div className="rounded-xl border">
  <div className="border-b px-4 py-3">
    <h3 className="text-base font-medium">Title</h3>
  </div>
  <div className="p-4">Content</div>
</div>
```

### Modals

#### Modal Structure
```jsx
<div className="fixed inset-0 z-50 bg-black/60 grid place-items-center px-4">
  <div className="w-full max-w-3xl rounded-2xl border bg-white dark:bg-neutral-950 shadow-xl">
    <div className="flex items-center justify-between border-b px-4 py-3">
      <h2 className="text-base font-medium">Modal Title</h2>
      <button className="inline-flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
    <div className="p-4">
      {/* Modal content */}
    </div>
  </div>
</div>
```

### Navigation

#### Sidebar Navigation Item
```jsx
className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[13px] hover:bg-neutral-50 dark:hover:bg-neutral-800"
```

#### Active State
```jsx
className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
```

#### Breadcrumb Navigation
```jsx
<nav className="text-xs">
  <button className="opacity-80 hover:opacity-100">Parent</button>
  <span className="mx-1">›</span>
  <span className="font-medium">Current</span>
</nav>
```

### Forms

#### Text Input
```jsx
className="w-full bg-transparent outline-none border-0 border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
```

#### Label
```jsx
className="text-xs text-neutral-600 dark:text-neutral-400"
```

#### Select/Dropdown
```jsx
className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm"
```

### Badges & Pills

#### Status Badge
```jsx
className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-400"
```

#### Tag/Chip
```jsx
className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs"
```

### Icons

#### Icon Sizes
- **Small**: `h-4 w-4` (16px)
- **Medium**: `h-5 w-5` (20px)
- **Large**: `h-6 w-6` (24px)

#### Icon Spacing
- **With text**: `gap-2` (8px)
- **Standalone**: Add `opacity-70` or `opacity-80` for subtlety

## Interactive States

### Hover Effects
- **Opacity change**: `opacity-70 hover:opacity-100`
- **Background fill**: `hover:bg-neutral-50 dark:hover:bg-neutral-900`
- **Border emphasis**: `hover:border-neutral-300 dark:hover:border-neutral-700`

### Focus States
- **Ring**: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
- **Border**: `focus:border-blue-500`
- **Outline**: `focus:outline-none` (when using custom focus styles)

### Active/Selected States
- **Background**: Apply semantic color with appropriate opacity
- **Border**: Add colored border or ring
- **Icon**: Include checkmark or indicator icon

### Disabled States
- **Opacity**: `opacity-50 cursor-not-allowed`
- **Interaction**: `pointer-events-none`

## Animation & Transitions

### Standard Transitions
```css
--transition-default: transition-all duration-200 ease-in-out
--transition-fast: transition-all duration-150 ease-in-out
--transition-slow: transition-all duration-300 ease-in-out
```

### Common Animations
- **Spinner**: `animate-spin` for loading indicators
- **Fade in/out**: Use opacity transitions
- **Slide**: Transform with translate for drawer/panel animations

## Responsive Design

### Breakpoints
```css
--screen-sm: 640px
--screen-md: 768px
--screen-lg: 1024px
--screen-xl: 1280px
--screen-2xl: 1536px
```

### Mobile Adaptations
- **Stack layouts**: Convert horizontal to vertical on small screens
- **Reduce padding**: Use `p-4` mobile, `md:p-5` desktop
- **Hide secondary elements**: Use `hidden md:block` for non-essential items
- **Full-width modals**: Remove max-width constraints on mobile

## Accessibility Guidelines

### Focus Management
- All interactive elements must have visible focus states
- Use `tabindex` appropriately for custom components
- Implement keyboard navigation for complex components

### ARIA Labels
- Provide descriptive `aria-label` for icon-only buttons
- Use `aria-current` for active navigation items
- Include `role` and `aria-modal` for modal dialogs

### Color Contrast
- Maintain WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information
- Test both light and dark modes for sufficient contrast

## Implementation Guidelines

### Component Composition
1. Start with semantic HTML structure
2. Apply utility classes for styling
3. Extract common patterns into reusable components
4. Use conditional classes for theme-aware styling

### Theme Variables
```jsx
// Example theme-aware implementation
const surfaceBg = darkMode ? "bg-neutral-950" : "bg-white"
const textMuted = darkMode ? "text-neutral-400" : "text-neutral-600"
const borderClass = darkMode ? "border-neutral-800" : "border-neutral-200"
```

### Naming Conventions
- Use descriptive class combinations
- Group related utilities logically
- Comment complex class strings for clarity
- Extract repeated patterns into constants

### Performance Considerations
- Minimize DOM manipulation for theme switches
- Use CSS transitions instead of JavaScript animations
- Lazy load heavy components (modals, dropdowns)
- Optimize image assets and use appropriate formats

## Usage Examples

### Creating a New Feature Card
```jsx
<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-base font-semibold">Feature Name</h3>
    <FeatureIcon className="h-4 w-4 opacity-80" />
  </div>
  <p className="text-xs text-neutral-600 dark:text-neutral-400">
    Feature description text
  </p>
  <button className="mt-4 rounded-lg px-3.5 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
    Get Started
  </button>
</div>
```

### Building a Settings Panel
```jsx
<div className="space-y-4">
  <div>
    <label className="text-xs text-neutral-600 dark:text-neutral-400">
      Setting Name
    </label>
    <input
      className="mt-1 w-full bg-transparent outline-none border-0 border-b border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 pb-1"
      placeholder="Enter value"
    />
  </div>
  <div className="flex items-center justify-between">
    <span className="text-sm">Enable Feature</span>
    <Switch className="..." />
  </div>
</div>
```

## Maintenance & Evolution

### Regular Reviews
- Audit component usage quarterly
- Update color palette based on accessibility standards
- Review and refactor duplicate patterns
- Document new patterns as they emerge

### Version Control
- Tag design system updates with semantic versioning
- Maintain changelog for breaking changes
- Provide migration guides for major updates

### Testing
- Visual regression testing for component changes
- Cross-browser compatibility checks
- Accessibility audits with automated tools
- User testing for major UI changes

---

*This design system is a living document and should be updated as the application evolves. All team members should reference this guide when implementing new features or modifying existing UI components.*