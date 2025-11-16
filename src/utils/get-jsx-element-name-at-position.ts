import { Node, SourceFile, SyntaxKind } from 'ts-morph'

/**
 * Get the JSX element tag name at a specific position
 */
export function getJsxElementNameAtPosition(sourceFile: SourceFile, offset: number): string | null {
  try {
    const node = sourceFile.getDescendantAtPos(offset)
    if (!node) return null
    
    // Find any JSX element (with or without style)
    const jsxElement = node.getFirstAncestorByKind(SyntaxKind.JsxElement) 
      ?? node.getFirstAncestorByKind(SyntaxKind.JsxSelfClosingElement)
      ?? (Node.isJsxElement(node) || Node.isJsxSelfClosingElement(node) ? node : null)
    
    if (!jsxElement) return null
    
    // Get the opening element
    const openingElement = jsxElement.getKind() === SyntaxKind.JsxElement
      ? jsxElement.asKindOrThrow(SyntaxKind.JsxElement).getOpeningElement()
      : jsxElement.asKindOrThrow(SyntaxKind.JsxSelfClosingElement)
    
    return openingElement.getTagNameNode().getText()
  } catch (error) {
    console.error('Error getting JSX element name:', error)
    return null
  }
}