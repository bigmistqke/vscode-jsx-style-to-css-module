import * as fs from 'node:fs'
import * as path from 'node:path'
import { defineExtension, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { window, workspace, WorkspaceEdit } from 'vscode'
import { generateUniqueClassName, stylesToCSS } from './utils/style-helpers'
import { transformJsxStyleToClassName } from './utils/ast-transformer'

const { activate, deactivate } = defineExtension(() => {
  // Helper to get configuration values
  function getConfig<T>(key: string): T | undefined {
    return workspace.getConfiguration('style-to-css-module').get<T>(key)
  }

  useCommand('style-to-css-module', async () => {
    const editor = window.activeTextEditor
    if (!editor) {
      window.showErrorMessage('No active editor')
      return
    }

    const document = editor.document
    const position = editor.selection.active

    // Get configuration
    const classAttribute = getConfig<'className' | 'class'>('classAttribute') || 'className'
    const cssPropertyNaming = getConfig<'kebab-case' | 'camelCase'>('cssPropertyNaming') || 'kebab-case'

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

    // Prompt for class name (we need this before transformation)
    let className = await window.showInputBox({
      prompt: 'Enter class name (press Enter for random name)',
      placeHolder: 'my-class',
    })

    if (!className) {
      // We need element name for random generation, so let's get a temp one
      className = 'temp-class'
    }

    // Transform the AST
    const transformResult = transformJsxStyleToClassName(document, position, className, classAttribute)

    if (!transformResult) {
      window.showErrorMessage('No inline style found at cursor position')
      return
    }

    // If we used temp class name, generate a proper one now
    if (className === 'temp-class') {
      className = generateUniqueClassName(cssContent, transformResult.elementName)
      
      // Re-transform with the correct class name
      const finalTransformResult = transformJsxStyleToClassName(document, position, className, classAttribute)
      if (finalTransformResult) {
        transformResult.transformedCode = finalTransformResult.transformedCode
        transformResult.className = className
      }
    }

    // Convert extracted styles to CSS
    const styleProperties: { [key: string]: string } = {}
    transformResult.extractedStyles.forEach(style => {
      styleProperties[style.name] = style.value
    })

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
    const documentText = document.getText()
    let transformedCode = transformResult.transformedCode

    // Add import if it doesn't exist
    if (!documentText.includes(`./${fileBaseName}.module.css`)) {
      const importStatement = `import styles from './${fileBaseName}.module.css'\n`
      transformedCode = importStatement + transformedCode
    }

    // Replace the entire document with transformed code
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(documentText.length)
    )
    
    edit.replace(document.uri, fullRange, transformedCode)

    // Apply edits
    await workspace.applyEdit(edit)

    window.showInformationMessage(`Styles extracted to ${className} in ${fileBaseName}.module.css`)

    // Save the document
    await document.save()
  })
})

export { activate, deactivate }