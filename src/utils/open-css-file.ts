import * as vscode from 'vscode'
import { findClassPosition } from './css-parser'

/**
 * Opens a CSS file in the editor side-by-side and scrolls to a specific class definition
 * @param cssFilePath - Path to the CSS file to open
 * @param className - The CSS class name to scroll to (without the dot prefix)
 * @returns Promise that resolves when the file is opened and scrolled
 */
export async function openCssFileAndScrollToClass(
  cssFilePath: string,
  className: string,
): Promise<void> {
  try {
    // Open the CSS file
    const document = await vscode.workspace.openTextDocument(cssFilePath)
    
    // Check if there's already a tab group to the right
    let targetViewColumn = vscode.ViewColumn.Beside
    
    // If the active editor is already in the rightmost column, open beside it
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor && activeEditor.viewColumn) {
      // Open in the next column to the right
      targetViewColumn = activeEditor.viewColumn + 1
    }
    
    // Show the document in the editor side-by-side
    const editor = await vscode.window.showTextDocument(document, {
      viewColumn: targetViewColumn,
      preserveFocus: false,
      preview: false,
    })
    
    // Find the class definition in the CSS file using CSS parser
    const text = document.getText()
    const classInfo = findClassPosition(text, className)
    
    if (classInfo) {
      // Convert line/column to VSCode position (VSCode uses 0-based indexing)
      const position = new vscode.Position(classInfo.startLine - 1, classInfo.startColumn - 1)
      
      // Move cursor to the class definition
      editor.selection = new vscode.Selection(position, position)
      
      // Scroll to reveal the class definition in the center of the viewport
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter,
      )
    }
  } catch (error) {
    console.error('Failed to open CSS file and scroll to class:', error)
    // Don't show error to user as this is a convenience feature
  }
}

