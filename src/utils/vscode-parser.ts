import * as vscode from 'vscode'
import * as ts from 'typescript'

export interface StyleInfo {
  styleValue: string
  styleRange: vscode.Range
  elementName: string
}

/**
 * Get style information at the cursor position using TypeScript compiler API
 */
export async function getStyleInfoAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<StyleInfo | null> {
  try {
    // Create source file using TypeScript compiler API
    const sourceFile = ts.createSourceFile(
      document.fileName,
      document.getText(),
      ts.ScriptTarget.Latest,
      true, // setParentNodes - important for traversal
      getScriptKind(document.fileName)
    )
    
    const offset = document.offsetAt(position)
    
    // Find the AST node at the cursor position
    const nodeAtPosition = findNodeAtPosition(sourceFile, offset)
    
    if (!nodeAtPosition) {
      return null
    }
    
    // Walk up the AST to find JSX element with style attribute
    const jsxElementWithStyle = findJsxElementWithStyle(nodeAtPosition)
    
    if (!jsxElementWithStyle) {
      return null
    }
    
    return extractStyleInfo(document, jsxElementWithStyle.element, jsxElementWithStyle.styleAttribute)
    
  } catch (error) {
    console.error('Error parsing TypeScript AST:', error)
    return null
  }
}

function getScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) {
    return ts.ScriptKind.TSX
  } else if (fileName.endsWith('.jsx')) {
    return ts.ScriptKind.JSX
  } else if (fileName.endsWith('.ts')) {
    return ts.ScriptKind.TS
  } else {
    return ts.ScriptKind.JS
  }
}

function findNodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node | null {
  function visit(node: ts.Node): ts.Node | null {
    // Check if position is within this node's range
    if (position >= node.getFullStart() && position < node.getEnd()) {
      // Try to find a more specific child node
      const child = ts.forEachChild(node, visit)
      return child || node
    }
    return null
  }
  
  return visit(sourceFile)
}

interface JsxElementWithStyle {
  element: ts.JsxElement | ts.JsxSelfClosingElement
  styleAttribute: ts.JsxAttribute
}

function findJsxElementWithStyle(startNode: ts.Node): JsxElementWithStyle | null {
  let current = startNode
  
  while (current) {
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) {
      const styleAttribute = findStyleAttribute(current)
      if (styleAttribute) {
        return {
          element: current,
          styleAttribute
        }
      }
    }
    current = current.parent
  }
  
  return null
}

function findStyleAttribute(element: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxAttribute | null {
  const attributes = ts.isJsxElement(element) 
    ? element.openingElement.attributes 
    : element.attributes
  
  for (const attribute of attributes.properties) {
    if (ts.isJsxAttribute(attribute) && 
        ts.isIdentifier(attribute.name) && 
        attribute.name.text === 'style') {
      return attribute
    }
  }
  
  return null
}

function extractStyleInfo(
  document: vscode.TextDocument,
  element: ts.JsxElement | ts.JsxSelfClosingElement,
  styleAttribute: ts.JsxAttribute
): StyleInfo | null {
  // Get element name
  const tagName = ts.isJsxElement(element) 
    ? element.openingElement.tagName 
    : element.tagName
  
  let elementName: string
  if (ts.isIdentifier(tagName)) {
    elementName = tagName.text
  } else if (ts.isPropertyAccessExpression(tagName)) {
    elementName = tagName.getText()
  } else {
    return null
  }
  
  // Get style value from JSX expression
  if (!styleAttribute.initializer || !ts.isJsxExpression(styleAttribute.initializer)) {
    return null
  }
  
  const expression = styleAttribute.initializer.expression
  if (!expression || !ts.isObjectLiteralExpression(expression)) {
    return null
  }
  
  // Get the text content of the style object
  const styleValue = expression.getText()
  
  // Calculate ranges for replacement
  const styleAttrStart = styleAttribute.getStart()
  const styleAttrEnd = styleAttribute.getEnd()
  
  const styleRange = new vscode.Range(
    document.positionAt(styleAttrStart),
    document.positionAt(styleAttrEnd)
  )
  
  return {
    elementName,
    styleValue,
    styleRange
  }
}