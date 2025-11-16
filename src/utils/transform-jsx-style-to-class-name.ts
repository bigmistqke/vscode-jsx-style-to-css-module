import {
  Node,
  SyntaxKind,
  JsxAttribute,
  SourceFile,
  JsxElement,
  JsxSelfClosingElement,
} from 'ts-morph'

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

export interface TransformInput {
  sourceFile: SourceFile
  offset: number
  className: string
  classAttribute: 'class' | 'className'
}

/**
 * Check if a string is a valid JavaScript identifier that can be used with dot notation
 */
function isValidIdentifier(str: string): boolean {
  // 1. Only alphanumeric characters
  // 2. Not start with a number
  const identifierRegex = /^[a-zA-Z][a-zA-Z0-9]*$/
  
  return identifierRegex.test(str)
}

/**
 * Transform JSX by replacing style prop with className prop and extracting styles
 */
export function transformJsxStyleToClassName(input: TransformInput): TransformResult | null {
  const { sourceFile, offset, className, classAttribute } = input

  try {
    // Find JSX element at position
    const jsxElement = findJsxElementWithStyleAtPosition(sourceFile, offset)
    if (!jsxElement) return null

    // Get the opening element
    const openingElement =
      jsxElement.getKind() === SyntaxKind.JsxElement
        ? jsxElement.asKindOrThrow(SyntaxKind.JsxElement).getOpeningElement()
        : jsxElement.asKindOrThrow(SyntaxKind.JsxSelfClosingElement)

    // Find style attribute
    const styleAttr = openingElement.getAttribute('style') as JsxAttribute | undefined
    if (!styleAttr) return null

    // Get style object literal
    const styleExpression = styleAttr.getInitializer()?.asKind(SyntaxKind.JsxExpression)
    const objectLiteral = styleExpression
      ?.getExpression()
      ?.asKind(SyntaxKind.ObjectLiteralExpression)
    if (!objectLiteral) return null

    // Extract styles
    const { staticStyles, dynamicProperties } = extractStyles(objectLiteral)

    // Get element name before transformation
    const elementName = openingElement.getTagNameNode().getText()

    // Transform the element
    if (staticStyles.length > 0) {
      // Add className/class attribute
      const classNameValue = isValidIdentifier(className) 
        ? `styles.${className}` 
        : `styles["${className}"]`

      // Check if className/class attribute already exists
      const existingClassAttr = openingElement.getAttribute(classAttribute) as
        | JsxAttribute
        | undefined

      if (existingClassAttr) {
        // Merge with existing className
        const existingInit = existingClassAttr.getInitializer()
        if (existingInit) {
          const existingValue = existingInit.getText()
          // Handle different cases of existing className
          if (existingValue.startsWith('{') && existingValue.endsWith('}')) {
            const inner = existingValue.slice(1, -1)
            existingClassAttr.setInitializer(`{\`\${${inner}} \${${classNameValue}}\`}`)
          } else {
            existingClassAttr.setInitializer(`{${classNameValue}}`)
          }
        } else {
          existingClassAttr.setInitializer(`{${classNameValue}}`)
        }
      } else {
        // Add new className attribute
        openingElement.addAttribute({
          name: classAttribute,
          initializer: `{${classNameValue}}`,
        })
      }
    }

    // Update or remove style attribute
    if (dynamicProperties.length > 0) {
      // Keep only dynamic styles
      const dynamicPropsText = dynamicProperties.map(prop => prop.getText()).join(', ')
      styleAttr.setInitializer(`{{ ${dynamicPropsText} }}`)
    } else {
      // Remove style attribute completely
      styleAttr.remove()
    }

    return {
      transformedCode: sourceFile.getFullText(),
      extractedStyles: staticStyles,
      elementName,
      className,
    }
  } catch (error) {
    console.error('Error transforming JSX:', error)
    return null
  }
}

/**
 * Find JSX element with style attribute at position
 */
function findJsxElementWithStyleAtPosition(
  sourceFile: SourceFile,
  offset: number,
): JsxElement | JsxSelfClosingElement | null {
  const node = sourceFile.getDescendantAtPos(offset)
  if (!node) return null

  // Walk up the tree to find JSX element with style attribute
  let current: Node | undefined = node
  while (current) {
    if (Node.isJsxElement(current) || Node.isJsxSelfClosingElement(current)) {
      const openingElement = Node.isJsxElement(current) ? current.getOpeningElement() : current

      // Check if it has a style attribute with object literal
      const styleAttr = openingElement.getAttribute('style') as JsxAttribute | undefined
      if (styleAttr) {
        const styleExpression = styleAttr.getInitializer()?.asKind(SyntaxKind.JsxExpression)
        const objectLiteral = styleExpression
          ?.getExpression()
          ?.asKind(SyntaxKind.ObjectLiteralExpression)
        if (objectLiteral) {
          return current
        }
      }
    }
    current = current.getParent()
  }

  return null
}

interface StyleExtractionResult {
  staticStyles: StyleProperty[]
  dynamicProperties: Node[]
  hasOnlyStaticStyles: boolean
}

/**
 * Extract static and dynamic styles from an object literal
 */
function extractStyles(objectLiteral: Node): StyleExtractionResult {
  const staticStyles: StyleProperty[] = []
  const dynamicProperties: Node[] = []

  if (!objectLiteral.asKind(SyntaxKind.ObjectLiteralExpression)) {
    return { staticStyles, dynamicProperties, hasOnlyStaticStyles: true }
  }

  const objLit = objectLiteral.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  for (const prop of objLit.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const nameNode = prop.getNameNode()
      const initializer = prop.getInitializer()

      // Check if it's a computed property name (dynamic)
      if (Node.isComputedPropertyName(nameNode)) {
        dynamicProperties.push(prop)
        continue
      }

      // Get property name, handling both identifier and string literal cases
      let name: string
      if (Node.isIdentifier(nameNode)) {
        name = nameNode.getText()
      } else if (Node.isStringLiteral(nameNode)) {
        name = nameNode.getLiteralValue()
      } else {
        name = prop.getName()
      }

      if (initializer && isStaticValue(initializer)) {
        staticStyles.push({
          name,
          value: getStaticValue(initializer),
        })
      } else {
        dynamicProperties.push(prop)
      }
    } else if (Node.isSpreadAssignment(prop)) {
      // Spreads are always dynamic
      dynamicProperties.push(prop)
    } else {
      // Other property types are dynamic
      dynamicProperties.push(prop)
    }
  }

  return {
    staticStyles,
    dynamicProperties,
    hasOnlyStaticStyles: dynamicProperties.length === 0,
  }
}

/**
 * Check if a value is static
 */
function isStaticValue(node: Node): boolean {
  return (
    Node.isStringLiteral(node) ||
    Node.isNumericLiteral(node) ||
    node.getKind() === SyntaxKind.TrueKeyword ||
    node.getKind() === SyntaxKind.FalseKeyword ||
    Node.isNoSubstitutionTemplateLiteral(node)
  )
}

/**
 * Get the static value from a node
 */
function getStaticValue(node: Node): string {
  if (Node.isStringLiteral(node)) {
    return node.getLiteralValue()
  } else if (Node.isNumericLiteral(node)) {
    return node.getLiteralValue().toString()
  } else if (Node.isNoSubstitutionTemplateLiteral(node)) {
    // Remove backticks
    return node.getText().slice(1, -1)
  } else if (
    node.getKind() === SyntaxKind.TrueKeyword ||
    node.getKind() === SyntaxKind.FalseKeyword
  ) {
    return node.getText()
  }
  return node.getText()
}
