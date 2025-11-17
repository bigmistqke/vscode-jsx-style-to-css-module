# vscode-jsx-style-to-css

Extension that allows to improve DX around refactoring code from using inlined styles to using css-module classes

## Features

- 🎯 **Smart Style Extraction**: Extracts static styles to CSS modules while preserving dynamic styles inline
- 🔄 **Dot Notation Support**: Generates `styles.className` for valid identifiers, falls back to `styles["class-name"]` for invalid ones
- 📱 **Side-by-Side View**: Automatically opens CSS module file alongside your JSX file for easy comparison
- ⚡ **Framework Support**: Works with React, Solid.js, and other JSX frameworks
- 🎨 **Mixed Styles**: Intelligently separates static and dynamic styles in the same element

## Usage

The extension provides two commands:

<!-- commands -->

| Command                            | Title                                                       |
| ---------------------------------- | ----------------------------------------------------------- |
| `jsx-style-to-css-module`          | Refactor: Extract Inline Styles to CSS Module               |
| `jsx-style-to-css-module-and-open` | Refactor: Extract Inline Styles to CSS Module and Open File |

<!-- commands -->

### 1. Extract Inline Styles to CSS Module
1. Place your cursor inside a JSX/TSX element that has inline styles
2. Open command palette and use action "Refactor: Extract Inline Styles to CSS Module"
3. Extension will extract styles without opening the CSS file

### 2. Extract Inline Styles to CSS Module and Open File
1. Place your cursor inside a JSX/TSX element that has inline styles
2. Open command palette and use action "Refactor: Extract Inline Styles to CSS Module and Open File"
3. Extension will extract styles AND open the CSS module file side-by-side, scrolling to the new class

### What both commands do:
1. Create a css-module of the same name as file + .module.css if it does not exist yet
2. Give you the option to specify the class name (pressing enter will create randomized name)
3. Move the static inlined styles to a class with the specified name
4. Import the .module.css and add the class to the component
5. Preserve dynamic styles inline while extracting static ones

## Smart Style Processing

The extension intelligently handles different types of styles:

### ✅ Static Styles (Extracted to CSS)

- String literals: `color: 'red'`
- Number literals: `width: 100`
- Template literals without expressions: `background: 'url(/image.png)'`

### ❌ Dynamic Styles (Kept Inline)

- Variables: `color: primaryColor`
- Function calls: `padding: getPadding()`
- Template literals with expressions: `width: \`\${size}px\``
- Conditional expressions: `opacity: isActive ? 1 : 0.5`
- Spread operators: `...dynamicStyles`

## Class Attribute Behavior

When you extract styles from an element that already has a `className` or `class` attribute, the extension **creates a separate class attribute** instead of attempting to merge them. This gives you full control over how to handle multiple classes.

### Example

**Before:**
```jsx
<div className="existing-class" style={{ backgroundColor: 'red', padding: '10px' }}>
  Content
</div>
```

**After:**
```jsx
<div className="existing-class" className={styles['new-styles']}>
  Content
</div>
```

The browser will use the last `className` attribute, so you'll need to manually merge them if desired:
```jsx
<div className={`existing-class ${styles['new-styles']}`}>
  Content
</div>
```

This approach keeps the tool simple and predictable, letting you decide how to handle class name conflicts.

## Configuration

Configure these in your workspace or user settings:

<!-- configs -->

| Key                                         | Description                                                                                     | Type     | Default        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- | -------------- |
| `jsx-style-to-css-module.classAttribute`    | The attribute name to use for CSS classes (className for React, class for Solid)                | `string` | `"class"`      |
| `jsx-style-to-css-module.cssPropertyNaming` | The naming convention for CSS properties (kebab-case for standard CSS, camelCase for CSS-in-JS) | `string` | `"kebab-case"` |

<!-- configs -->

- `style-to-css-module.classAttribute`: Choose between `"className"` (React) or `"class"` (Solid) - **Default: `"className"`**
- `style-to-css-module.cssPropertyNaming`: Choose between `"kebab-case"` (standard CSS) or `"camelCase"` (CSS-in-JS) - **Default: `"kebab-case"`**
