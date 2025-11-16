import * as fs from 'node:fs'
import * as path from 'node:path'
import { defineExtension, useCommand } from 'reactive-vscode'
import { Range, window, workspace, WorkspaceEdit } from 'vscode'
import { generateRandomClassName, parseStyleObject, stylesToCSS } from './utils/style-helpers'

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
    const selection = editor.selection
    const selectedText = document.getText(selection)

    // Find style prop in selection
    const styleMatch = selectedText.match(/style\s*=\s*\{\s*\{([^}]+)\}\s*\}/)
    if (!styleMatch) {
      window.showErrorMessage('No inline style found in selection')
      return
    }

    const styleContent = styleMatch[1]
    const styles = parseStyleObject(styleContent)

    // Prompt for class name
    const className = await window.showInputBox({
      prompt: 'Enter class name (press Enter for random name)',
      placeHolder: 'my-class',
    }) || generateRandomClassName()

    // Get file paths
    const filePath = document.fileName
    const fileDir = path.dirname(filePath)
    const fileBaseName = path.basename(filePath, path.extname(filePath))
    const cssModulePath = path.join(fileDir, `${fileBaseName}.module.css`)

    // Create or update CSS module file
    let cssContent = ''
    if (fs.existsSync(cssModulePath)) {
      cssContent = fs.readFileSync(cssModulePath, 'utf8')
      if (!cssContent.endsWith('\n')) {
        cssContent += '\n'
      }
    }

    const cssPropertyNaming = getConfig<'kebab-case' | 'camelCase'>('cssPropertyNaming') || 'kebab-case'
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
    }
    else {
      // Add import at the top of the file
      const firstLine = document.lineAt(0)
      const importStatement = `import styles from './${fileBaseName}.module.css'\n`
      edit.insert(document.uri, firstLine.range.start, importStatement)
    }

    // Replace style prop with className
    const styleStartPos = document.positionAt(documentText.indexOf(styleMatch[0]))
    const styleEndPos = document.positionAt(documentText.indexOf(styleMatch[0]) + styleMatch[0].length)
    const styleRange = new Range(styleStartPos, styleEndPos)

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
