import * as fs from 'node:fs'
import * as path from 'node:path'
import { defineExtension, useCommand } from 'reactive-vscode'
import { window, workspace, WorkspaceEdit } from 'vscode'
import { generateUniqueClassName, parseStyleObject, stylesToCSS } from './utils/style-helpers'
import { getStyleInfoAtPosition } from './utils/vscode-parser'

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

    // Use VSCode's language service to get style information
    const styleInfo = await getStyleInfoAtPosition(document, position)

    if (!styleInfo) {
      window.showErrorMessage('No inline style found at cursor position')
      return
    }

    const { elementName, styleValue, styleRange } = styleInfo
    const styles = parseStyleObject(styleValue)

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

    // Prompt for class name
    let className = await window.showInputBox({
      prompt: 'Enter class name (press Enter for random name)',
      placeHolder: 'my-class',
    })

    if (!className) {
      // Generate unique class name
      className = generateUniqueClassName(cssContent, elementName)
      if (!className) {
        window.showErrorMessage('Could not generate unique class name after 100 attempts')
        return
      }
    }

    // Ensure CSS content ends with newline
    if (cssContent && !cssContent.endsWith('\n')) {
      cssContent += '\n'
    }

    const cssPropertyNaming =
      getConfig<'kebab-case' | 'camelCase'>('cssPropertyNaming') || 'kebab-case'
    cssContent += `.${className} {\n${stylesToCSS(styles, cssPropertyNaming)}\n}\n`
    fs.writeFileSync(cssModulePath, cssContent)

    // Prepare edits
    const edit = new WorkspaceEdit()

    // Check if CSS module is already imported
    const documentText = document.getText()
    const importRegex = /import\s+(\w+)\s+from\s+['"]\.\/[^'"]+\.module\.css['"]/
    const existingImport = documentText.match(importRegex)

    let stylesVarName = 'styles'
    if (existingImport) {
      stylesVarName = existingImport[1]
    } else {
      // Add import at the top of the file
      const firstLine = document.lineAt(0)
      const importStatement = `import styles from './${fileBaseName}.module.css'\n`
      edit.insert(document.uri, firstLine.range.start, importStatement)
    }

    // Style range is already provided by the parser

    const classAttribute = getConfig<'className' | 'class'>('classAttribute') || 'className'
    console.log('Config - classAttribute:', classAttribute)
    console.log('Config - cssPropertyNaming:', cssPropertyNaming)

    edit.replace(document.uri, styleRange, `${classAttribute}={${stylesVarName}['${className}']}`)

    // Apply edits
    await workspace.applyEdit(edit)

    window.showInformationMessage(`Styles extracted to ${className} in ${fileBaseName}.module.css`)

    // Also save the document to apply the edits
    await document.save()
  })
})

export { activate, deactivate }
