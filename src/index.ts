import * as fs from 'node:fs'
import * as path from 'node:path'
import { defineExtension, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { window, workspace, WorkspaceEdit } from 'vscode'
import { Parser } from 'acorn'
import { tsPlugin } from '@sveltejs/acorn-typescript'
import type { Node } from 'acorn'

const TypeScriptParser = Parser.extend(tsPlugin({ jsx: true }))
import { classExists } from './utils/css-parser'
import { getJsxElementNameAtPosition } from './utils/get-jsx-element-name-at-position'
import { openCssFileAndScrollToClass } from './utils/open-css-file'
import { generateUniqueClassName, stylesToCSS } from './utils/style-helpers'
import { transformJsxStyleToClassName } from './utils/transform-jsx-style-to-class-name'

const { activate, deactivate } = defineExtension(() => {
  // Helper to get configuration values
  function getConfig<T>(key: string): T | undefined {
    return workspace.getConfiguration('style-to-css-module').get<T>(key)
  }

  // Helper function to extract styles to CSS module
  async function extractStylesToModule(openCssFile: boolean = false) {
    const editor = window.activeTextEditor
    if (!editor) {
      window.showErrorMessage('No active editor')
      return
    }

    const document = editor.document
    const position = editor.selection.active

    // Get configuration
    const classAttribute = getConfig<'className' | 'class'>('classAttribute') ?? 'class'
    const cssPropertyNaming
      = getConfig<'kebab-case' | 'camelCase'>('cssPropertyNaming') ?? 'kebab-case'

    // Get file paths
    const filePath = document.fileName
    const fileDir = path.dirname(filePath)
    const fileBaseName = path.basename(filePath, path.extname(filePath))
    const cssModulePath = path.join(fileDir, `${fileBaseName}.module.css`)

    // Read existing CSS content
    let cssContent = ''
    if (fs.existsSync(cssModulePath)) {
      cssContent = fs.readFileSync(cssModulePath, 'utf8')
    }

    // Create AST once
    const documentText = document.getText()
    const offset = document.offsetAt(position)
    const ast = TypeScriptParser.parse(documentText, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    // Get element name first if needed  
    const elementName = getJsxElementNameAtPosition(ast, offset)
    if (!elementName) {
      window.showErrorMessage('No JSX element found at cursor position')
      return
    }

    // Prompt for class name with validation
    let className: string | undefined
    const attempts = 0

    while (!className?.trim() || classExists(cssContent, className)) {
      const promptMessage = attempts === 0
        ? 'Enter class name:'
        : `Class "${className}" already exists. Try a different name:`

      className = await window.showInputBox({
        prompt: promptMessage,
        placeHolder: 'my-class (empty = random)',
        value: attempts > 0 ? '' : undefined, // Clear previous input on retry
      })

      // User cancelled
      if (className === undefined) {
        window.showInformationMessage('Style extraction cancelled')
        return
      }

      // Trim whitespace from start and end
      className = className.trim()

      // If trimmed class-name is empty string
      // we create a unique class-name
      if (className === '') {
        className = generateUniqueClassName(cssContent, elementName)
      }
    }

    // Transform the AST
    const transformResult = transformJsxStyleToClassName({
      ast,
      sourceCode: documentText,
      offset,
      className,
      classAttribute,
    })

    if (!transformResult) {
      window.showErrorMessage('No inline style found at cursor position')
      return
    }

    // Convert extracted styles to CSS
    const styleProperties = Object.fromEntries(
      transformResult.extractedStyles.map(({ name, value }) => [name, value]),
    )

    // Ensure CSS content ends with newline
    if (cssContent && !cssContent.endsWith('\n')) {
      cssContent += '\n'
    }

    // Add the new CSS class
    cssContent += `.${className} {\n${stylesToCSS(styleProperties, cssPropertyNaming)}\n}\n`
    fs.writeFileSync(cssModulePath, cssContent)

    // Prepare edits to replace the entire document
    const edit = new WorkspaceEdit()

    // Check if CSS module is already imported
    let transformedCode = transformResult.transformedCode

    // Add import if it doesn't exist
    if (!documentText.includes(`./${fileBaseName}.module.css`)) {
      const importStatement = `import styles from './${fileBaseName}.module.css'\n`
      transformedCode = importStatement + transformedCode
    }

    // Replace the entire document with transformed code
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(documentText.length),
    )

    edit.replace(document.uri, fullRange, transformedCode)

    // Apply edits
    await workspace.applyEdit(edit)

    window.showInformationMessage(`Styles extracted to ${className} in ${fileBaseName}.module.css`)

    // Save the document
    await document.save()

    // Open CSS file and scroll to new class if requested
    if (openCssFile) {
      await openCssFileAndScrollToClass(cssModulePath, className)
    }
  }

  // Register commands
  useCommand('jsx-style-to-css-module', async () => {
    await extractStylesToModule(false)
  })

  useCommand('jsx-style-to-css-module-and-open', async () => {
    await extractStylesToModule(true)
  })
})

export { activate, deactivate }
