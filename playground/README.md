# Extension Testing Playground

This directory contains test environments for the vscode-jsx-style-to-css extension.

## Directory Structure

- **react-app/**: React test environment with `className` and kebab-case CSS properties
- **solid-app/**: Solid test environment with `class` and kebab-case CSS properties

## Configuration

Each subdirectory has its own `.vscode/settings.json` with specific configurations:

### React App
```json
{
  "style-to-css-module.classAttribute": "className",
  "style-to-css-module.cssPropertyNaming": "kebab-case"
}
```

### Solid App
```json
{
  "style-to-css-module.classAttribute": "class",
  "style-to-css-module.cssPropertyNaming": "kebab-case"
}
```

## Testing Instructions

1. Open one of the subdirectories in VSCode
2. Open the `TestComponent.tsx` file
3. Select a component with inline styles
4. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
5. Run "Refactor: Extract Inline Styles to CSS Module"
6. Enter a class name or press Enter for a random name
7. The extension will:
   - Create a `.module.css` file
   - Move inline styles to the CSS module
   - Replace `style` prop with appropriate class attribute (`className` for React, `class` for Solid)
   - Add the CSS module import

## Notes

- The projects don't need to compile or run
- They're purely for testing the extension functionality
- Each environment is configured to match its framework's conventions