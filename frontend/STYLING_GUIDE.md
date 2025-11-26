# CRM Styling System Guide

## Overview
This guide explains the consolidated styling system for the CRM application, designed to fix all text visibility and styling inconsistencies.

## File Structure
```
frontend/src/styles/
├── consolidated.css      # Main styling system
├── component-fixes.css    # Component-specific fixes
├── globals.css           # Legacy (deprecated)
├── text-visibility-fix.css # Legacy (deprecated)
└── 3d-animations.css     # Legacy (deprecated)
```

## Key Features

### 1. **CSS Custom Properties (Variables)**
All colors and styling values are defined as CSS custom properties for consistency:
```css
:root {
  --dark-bg: #0F172A;
  --dark-card: #1E293B;
  --dark-primary-text: #FFFFFF;
  --dark-secondary-text: #94A3B8;
  /* ... more variables */
}
```

### 2. **Universal Text Visibility System**
```css
.text-visible { color: var(--foreground) !important; }
.text-visible-secondary { color: var(--muted-foreground) !important; }
.text-visible-positive { color: var(--dark-positive) !important; }
.text-visible-negative { color: var(--dark-negative) !important; }
.text-visible-cta { color: var(--dark-cta) !important; }
```

### 3. **Input Field System**
All form inputs use consistent styling:
```css
input, textarea, select {
  color: var(--input-foreground) !important;
  background-color: var(--input-background) !important;
  border: 1px solid var(--border) !important;
}
```

### 4. **Component System**
Standardized components with consistent styling:
- `.card` - Card components
- `.btn-primary` - Primary buttons
- `.btn-secondary` - Secondary buttons
- `.badge-*` - Status badges
- `.form-input` - Form inputs
- `.table` - Table components

## Usage Guidelines

### 1. **Text Colors**
Always use the visibility utility classes:
```jsx
<p className="text-visible">Primary text</p>
<p className="text-visible-secondary">Secondary text</p>
<span className="text-visible-positive">Success message</span>
```

### 2. **Form Elements**
Use the form input class for consistent styling:
```jsx
<input className="form-input" type="text" placeholder="Enter text" />
<textarea className="form-input" placeholder="Enter description" />
<select className="form-input">
  <option>Select option</option>
</select>
```

### 3. **Buttons**
Use standardized button classes:
```jsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
```

### 4. **Cards**
Use the card component for consistent layout:
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-content">
    <p>Card content</p>
  </div>
</div>
```

### 5. **Badges**
Use status-specific badge classes:
```jsx
<span className="badge badge-status-pending">Pending</span>
<span className="badge badge-status-approved">Approved</span>
<span className="badge badge-status-rejected">Rejected</span>
```

## Dark Theme Support

The system automatically supports dark theme through CSS custom properties. All components will adapt to dark mode without additional configuration.

## Responsive Design

The system includes mobile-first responsive utilities:
- `.mobile-container` - Responsive containers
- `.mobile-grid` - Responsive grid system
- `.mobile-text-*` - Responsive text sizing
- `.mobile-p-*` - Responsive padding

## Accessibility Features

### 1. **Focus Indicators**
```css
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### 2. **High Contrast Support**
```css
@media (prefers-contrast: high) {
  .high-contrast {
    border: 2px solid var(--foreground);
  }
}
```

### 3. **Reduced Motion Support**
```css
@media (prefers-reduced-motion: reduce) {
  .animate-* {
    animation: none;
  }
}
```

## Migration Guide

### From Old System
1. Replace `text-gray-*` classes with `text-visible-*`
2. Replace custom input styling with `form-input`
3. Replace custom button styling with `btn-primary`/`btn-secondary`
4. Replace custom card styling with `card` component

### Common Replacements
```jsx
// Old
<div className="bg-dark-card text-white">
  <p className="text-gray-400">Content</p>
</div>

// New
<div className="card">
  <p className="text-visible-secondary">Content</p>
</div>
```

## Troubleshooting

### 1. **Text Not Visible**
- Check if using `text-visible` or `text-visible-secondary`
- Ensure parent container has proper background color
- Check for conflicting CSS rules

### 2. **Form Inputs Not Styled**
- Use `form-input` class
- Check for conflicting CSS rules
- Ensure proper CSS import order

### 3. **Dark Theme Issues**
- Verify CSS custom properties are defined
- Check for hardcoded colors
- Ensure proper CSS import order

## Best Practices

1. **Always use utility classes** instead of custom CSS
2. **Test in both light and dark themes**
3. **Use semantic class names** for better maintainability
4. **Avoid inline styles** - use CSS classes instead
5. **Test on mobile devices** for responsive design

## Component Examples

### RMA Component
```jsx
<div className="rma-overdue-analysis">
  <h3 className="text-visible">RMA Analysis</h3>
  <p className="text-visible-secondary">Analysis details</p>
  <div className="badge badge-status-pending">Pending</div>
</div>
```

### Form Component
```jsx
<div className="form-group">
  <label className="form-label">RMA Number</label>
  <input className="form-input" type="text" placeholder="Enter RMA number" />
</div>
```

### Table Component
```jsx
<table className="rma-table">
  <thead>
    <tr>
      <th>RMA Number</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>RMA-001</td>
      <td><span className="badge badge-status-pending">Pending</span></td>
    </tr>
  </tbody>
</table>
```

This styling system ensures consistent, accessible, and maintainable styling across the entire CRM application.

















