import * as ts from 'typescript'

/**
 * Get the JSX element tag name at a specific position
 */
export function getJsxElementNameAtPosition(
  sourceFile: ts.SourceFile,
  offset: number,
): string | null {
  try {
    const element = findAnyJsxElementAtPosition(sourceFile, offset)
    if (!element) {
      return null
    }

    const tagName = ts.isJsxElement(element) ? element.openingElement.tagName : element.tagName

    return ts.isIdentifier(tagName) ? tagName.text : tagName.getText()
  } catch (error) {
    console.error('Error getting JSX element name:', error)
    return null
  }
}

function findAnyJsxElementAtPosition(
  sourceFile: ts.SourceFile,
  position: number,
): ts.JsxElement | ts.JsxSelfClosingElement | null {
  function visit(node: ts.Node): ts.JsxElement | ts.JsxSelfClosingElement | null {
    if (position >= node.getFullStart() && position < node.getEnd()) {
      // Check if this node is any JSX element
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        return node
      }

      // Continue searching in children
      const childResult = ts.forEachChild(node, visit)
      if (childResult) return childResult
    }
    return null
  }

  return visit(sourceFile)
}
