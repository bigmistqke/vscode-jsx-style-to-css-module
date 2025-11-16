import * as vscode from 'vscode'
import * as ts from 'typescript'

export interface StyleProperty {
  name: string
  value: string
}

export interface TransformResult {
  transformedCode: string
  extractedStyles: StyleProperty[]
  elementName: string
  className: string
}

/**
 * Transform JSX by replacing style prop with className prop and extracting styles
 */
export function transformJsxStyleToClassName(
  document: vscode.TextDocument,
  position: vscode.Position,
  className: string,
  classAttribute: 'class' | 'className'
): TransformResult | null {
  try {
    // Create source file
    const sourceFile = ts.createSourceFile(
      document.fileName,
      document.getText(),
      ts.ScriptTarget.Latest,
      true,
      getScriptKind(document.fileName)
    )
    
    const offset = document.offsetAt(position)
    
    // Find the target JSX element
    const targetElement = findJsxElementAtPosition(sourceFile, offset)
    if (!targetElement) {
      return null
    }
    
    // Extract styles from AST and transform
    const result = transformElement(sourceFile, targetElement, className, classAttribute)
    
    return result
    
  } catch (error) {
    console.error('Error transforming AST:', error)
    return null
  }
}

function getScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (fileName.endsWith('.ts')) return ts.ScriptKind.TS
  return ts.ScriptKind.JS
}

function findJsxElementAtPosition(sourceFile: ts.SourceFile, position: number): ts.JsxElement | ts.JsxSelfClosingElement | null {
  function visit(node: ts.Node): ts.JsxElement | ts.JsxSelfClosingElement | null {
    if (position >= node.getFullStart() && position < node.getEnd()) {
      // Check if this node is a JSX element with style
      if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && hasStyleAttribute(node)) {
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

function hasStyleAttribute(element: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
  const attributes = ts.isJsxElement(element) 
    ? element.openingElement.attributes 
    : element.attributes
  
  return attributes.properties.some(attr => 
    ts.isJsxAttribute(attr) && 
    ts.isIdentifier(attr.name) && 
    attr.name.text === 'style'
  )
}

function transformElement(
  sourceFile: ts.SourceFile,
  element: ts.JsxElement | ts.JsxSelfClosingElement,
  className: string,
  classAttribute: 'class' | 'className'
): TransformResult {
  // Get element name
  const tagName = ts.isJsxElement(element) 
    ? element.openingElement.tagName 
    : element.tagName
  
  const elementName = ts.isIdentifier(tagName) ? tagName.text : tagName.getText()
  
  // Extract styles from the style attribute
  const extractedStyles = extractStylesFromElement(element)
  
  // Transform the AST
  const transformedSourceFile = ts.transform(sourceFile, [
    createStyleToClassTransformer(element, className, classAttribute)
  ]).transformed[0]
  
  // Print the transformed code
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const transformedCode = printer.printFile(transformedSourceFile as ts.SourceFile)
  
  return {
    transformedCode,
    extractedStyles,
    elementName,
    className
  }
}

function extractStylesFromElement(element: ts.JsxElement | ts.JsxSelfClosingElement): StyleProperty[] {
  const attributes = ts.isJsxElement(element) 
    ? element.openingElement.attributes 
    : element.attributes
  
  for (const attribute of attributes.properties) {
    if (ts.isJsxAttribute(attribute) && 
        ts.isIdentifier(attribute.name) && 
        attribute.name.text === 'style') {
      
      if (attribute.initializer && 
          ts.isJsxExpression(attribute.initializer) && 
          attribute.initializer.expression &&
          ts.isObjectLiteralExpression(attribute.initializer.expression)) {
        
        return extractStylePropertiesFromObjectLiteral(attribute.initializer.expression)
      }
    }
  }
  
  return []
}

function extractStylePropertiesFromObjectLiteral(objectLiteral: ts.ObjectLiteralExpression): StyleProperty[] {
  const styles: StyleProperty[] = []
  
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      const name = getPropertyName(property.name)
      const value = getPropertyValue(property.initializer)
      
      if (name && value) {
        styles.push({ name, value })
      }
    }
  }
  
  return styles
}

function getPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) {
    return name.text
  } else if (ts.isStringLiteral(name)) {
    return name.text
  } else if (ts.isComputedPropertyName(name)) {
    // Handle computed property names if needed
    return null
  }
  return null
}

function getPropertyValue(initializer: ts.Expression): string | null {
  if (ts.isStringLiteral(initializer)) {
    return initializer.text
  } else if (ts.isNumericLiteral(initializer)) {
    return initializer.text
  } else if (ts.isTemplateExpression(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    // Handle template literals
    return initializer.getText().slice(1, -1) // Remove backticks
  }
  // For complex expressions, we might need to evaluate them or handle specially
  return initializer.getText()
}

function createStyleToClassTransformer(
  targetElement: ts.JsxElement | ts.JsxSelfClosingElement,
  className: string,
  classAttribute: 'class' | 'className'
): ts.TransformerFactory<ts.Node> {
  return (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node: ts.Node): ts.Node => {
      // If this is our target element, transform it
      if (node === targetElement) {
        return transformJsxElement(node as ts.JsxElement | ts.JsxSelfClosingElement, className, classAttribute, context)
      }
      
      return ts.visitEachChild(node, visit, context)
    }
    
    return (node: ts.Node) => ts.visitNode(node, visit)
  }
}

function transformJsxElement(
  element: ts.JsxElement | ts.JsxSelfClosingElement,
  className: string,
  classAttribute: 'class' | 'className',
  context: ts.TransformationContext
): ts.JsxElement | ts.JsxSelfClosingElement {
  if (ts.isJsxElement(element)) {
    // Transform JSX element
    const newOpeningElement = transformOpeningElement(element.openingElement, className, classAttribute, context)
    
    return context.factory.updateJsxElement(
      element,
      newOpeningElement,
      element.children,
      element.closingElement
    )
  } else {
    // Transform self-closing element
    return transformSelfClosingElement(element, className, classAttribute, context)
  }
}

function transformOpeningElement(
  openingElement: ts.JsxOpeningElement,
  className: string,
  classAttribute: 'class' | 'className',
  context: ts.TransformationContext
): ts.JsxOpeningElement {
  const newAttributes = transformAttributes(openingElement.attributes, className, classAttribute, context)
  
  return context.factory.updateJsxOpeningElement(
    openingElement,
    openingElement.tagName,
    openingElement.typeArguments,
    newAttributes
  )
}

function transformSelfClosingElement(
  element: ts.JsxSelfClosingElement,
  className: string,
  classAttribute: 'class' | 'className',
  context: ts.TransformationContext
): ts.JsxSelfClosingElement {
  const newAttributes = transformAttributes(element.attributes, className, classAttribute, context)
  
  return context.factory.updateJsxSelfClosingElement(
    element,
    element.tagName,
    element.typeArguments,
    newAttributes
  )
}

function transformAttributes(
  attributes: ts.JsxAttributes,
  className: string,
  classAttribute: 'class' | 'className',
  context: ts.TransformationContext
): ts.JsxAttributes {
  const newProperties: ts.JsxAttributeLike[] = []
  
  // Add all attributes except 'style'
  for (const property of attributes.properties) {
    if (ts.isJsxAttribute(property) && 
        ts.isIdentifier(property.name) && 
        property.name.text === 'style') {
      // Skip the style attribute - we'll replace it with className
      continue
    }
    newProperties.push(property)
  }
  
  // Add the className attribute
  const classNameAttribute = context.factory.createJsxAttribute(
    context.factory.createIdentifier(classAttribute),
    context.factory.createJsxExpression(
      undefined,
      context.factory.createElementAccessExpression(
        context.factory.createIdentifier('styles'),
        context.factory.createStringLiteral(className)
      )
    )
  )
  
  newProperties.push(classNameAttribute)
  
  return context.factory.updateJsxAttributes(attributes, newProperties)
}