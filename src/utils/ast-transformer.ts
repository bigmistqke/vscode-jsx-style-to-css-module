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
  const styleExtractionResult = extractStylesFromElement(element)
  
  // Transform the AST
  const transformedSourceFile = ts.transform(sourceFile, [
    createStyleToClassTransformer(element, className, classAttribute, styleExtractionResult)
  ]).transformed[0]
  
  // Print the transformed code
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const transformedCode = printer.printFile(transformedSourceFile as ts.SourceFile)
  
  return {
    transformedCode,
    extractedStyles: styleExtractionResult.staticStyles,
    elementName,
    className
  }
}

function extractStylesFromElement(element: ts.JsxElement | ts.JsxSelfClosingElement): StyleExtractionResult {
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
  
  return {
    staticStyles: [],
    dynamicProperties: [],
    hasOnlyStaticStyles: true
  }
}

export interface StyleExtractionResult {
  staticStyles: StyleProperty[]
  dynamicProperties: ts.ObjectLiteralElementLike[]
  hasOnlyStaticStyles: boolean
}

function extractStylePropertiesFromObjectLiteral(objectLiteral: ts.ObjectLiteralExpression): StyleExtractionResult {
  const staticStyles: StyleProperty[] = []
  const dynamicProperties: ts.ObjectLiteralElementLike[] = []
  
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      const name = getPropertyName(property.name)
      const staticValue = getStaticPropertyValue(property.initializer)
      
      if (name && staticValue !== null) {
        // This is a static style we can extract
        staticStyles.push({ name, value: staticValue })
      } else {
        // This is a dynamic style, keep it in the style prop
        dynamicProperties.push(property)
      }
    } else if (ts.isSpreadAssignment(property)) {
      // Always keep spread assignments as they're dynamic
      dynamicProperties.push(property)
    } else {
      // Other property types (methods, getters, setters) - keep as dynamic
      dynamicProperties.push(property)
    }
  }
  
  return {
    staticStyles,
    dynamicProperties,
    hasOnlyStaticStyles: dynamicProperties.length === 0
  }
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

function getStaticPropertyValue(initializer: ts.Expression): string | null {
  if (ts.isStringLiteral(initializer)) {
    return initializer.text
  } else if (ts.isNumericLiteral(initializer)) {
    return initializer.text
  } else if (ts.isNoSubstitutionTemplateLiteral(initializer)) {
    // Only simple template literals without expressions
    return initializer.getText().slice(1, -1) // Remove backticks
  } else if (ts.isTrueKeyword(initializer) || ts.isFalseKeyword(initializer)) {
    return initializer.getText()
  }
  
  // Anything else is considered dynamic (variables, function calls, expressions, etc.)
  return null
}

function createStyleToClassTransformer(
  targetElement: ts.JsxElement | ts.JsxSelfClosingElement,
  className: string,
  classAttribute: 'class' | 'className',
  styleExtractionResult: StyleExtractionResult
): ts.TransformerFactory<ts.Node> {
  return (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node: ts.Node): ts.Node => {
      // If this is our target element, transform it
      if (node === targetElement) {
        return transformJsxElement(
          node as ts.JsxElement | ts.JsxSelfClosingElement, 
          className, 
          classAttribute, 
          styleExtractionResult,
          context
        )
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
  styleExtractionResult: StyleExtractionResult,
  context: ts.TransformationContext
): ts.JsxElement | ts.JsxSelfClosingElement {
  if (ts.isJsxElement(element)) {
    // Transform JSX element
    const newOpeningElement = transformOpeningElement(element.openingElement, className, classAttribute, styleExtractionResult, context)
    
    return context.factory.updateJsxElement(
      element,
      newOpeningElement,
      element.children,
      element.closingElement
    )
  } else {
    // Transform self-closing element
    return transformSelfClosingElement(element, className, classAttribute, styleExtractionResult, context)
  }
}

function transformOpeningElement(
  openingElement: ts.JsxOpeningElement,
  className: string,
  classAttribute: 'class' | 'className',
  styleExtractionResult: StyleExtractionResult,
  context: ts.TransformationContext
): ts.JsxOpeningElement {
  const newAttributes = transformAttributes(openingElement.attributes, className, classAttribute, styleExtractionResult, context)
  
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
  styleExtractionResult: StyleExtractionResult,
  context: ts.TransformationContext
): ts.JsxSelfClosingElement {
  const newAttributes = transformAttributes(element.attributes, className, classAttribute, styleExtractionResult, context)
  
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
  styleExtractionResult: StyleExtractionResult,
  context: ts.TransformationContext
): ts.JsxAttributes {
  const newProperties: ts.JsxAttributeLike[] = []
  
  // Add all attributes, transforming the style attribute if needed
  for (const property of attributes.properties) {
    if (ts.isJsxAttribute(property) && 
        ts.isIdentifier(property.name) && 
        property.name.text === 'style') {
      
      // If we have dynamic styles, keep a modified style attribute
      if (!styleExtractionResult.hasOnlyStaticStyles) {
        const dynamicStyleAttribute = createDynamicStyleAttribute(styleExtractionResult.dynamicProperties, context)
        newProperties.push(dynamicStyleAttribute)
      }
      // Note: we skip adding the original style attribute since we're replacing it
      continue
    }
    newProperties.push(property)
  }
  
  // Add the className attribute (only if we extracted some static styles)
  if (styleExtractionResult.staticStyles.length > 0) {
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
  }
  
  return context.factory.updateJsxAttributes(attributes, newProperties)
}

function createDynamicStyleAttribute(
  dynamicProperties: ts.ObjectLiteralElementLike[],
  context: ts.TransformationContext
): ts.JsxAttribute {
  // Create a new object literal with only the dynamic properties
  const dynamicObjectLiteral = context.factory.createObjectLiteralExpression(
    dynamicProperties.map(prop => {
      if (ts.isPropertyAssignment(prop)) {
        return context.factory.createPropertyAssignment(
          prop.name,
          prop.initializer
        )
      } else if (ts.isSpreadAssignment(prop)) {
        return context.factory.createSpreadAssignment(
          prop.expression
        )
      } else {
        // For other property types (methods, getters, setters), preserve as-is
        return prop
      }
    }),
    false // not multiline for simple cases
  )
  
  return context.factory.createJsxAttribute(
    context.factory.createIdentifier('style'),
    context.factory.createJsxExpression(
      undefined,
      dynamicObjectLiteral
    )
  )
}