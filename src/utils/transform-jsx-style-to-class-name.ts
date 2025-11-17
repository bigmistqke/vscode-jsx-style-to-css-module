import type { Node } from 'acorn'
import { createDebug } from './create-debug'

const debug = createDebug('transform-jsx-style-to-class-name', false)

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
  ast: Node
  sourceCode: string
  offset: number
  className: string
  classAttribute: 'class' | 'className'
}

interface JSXElement extends Node {
  type: 'JSXElement'
  openingElement: JSXOpeningElement
  closingElement: JSXClosingElement | null
  children: Node[]
}

interface JSXOpeningElement extends Node {
  type: 'JSXOpeningElement'
  name: JSXIdentifier
  attributes: JSXAttribute[]
  selfClosing: boolean
}

interface JSXClosingElement extends Node {
  type: 'JSXClosingElement'
  name: JSXIdentifier
}

interface JSXIdentifier extends Node {
  type: 'JSXIdentifier'
  name: string
}

interface JSXAttribute extends Node {
  type: 'JSXAttribute'
  name: JSXIdentifier
  value: JSXExpressionContainer | Literal | null
}

interface JSXExpressionContainer extends Node {
  type: 'JSXExpressionContainer'
  expression: Expression
}

interface ObjectExpression extends Node {
  type: 'ObjectExpression'
  properties: Property[]
}

interface Property extends Node {
  type: 'Property'
  key: Identifier | Literal
  value: Expression
  computed: boolean
  kind: 'init' | 'get' | 'set'
}

interface SpreadElement extends Node {
  type: 'SpreadElement'
  argument: Expression
}

interface Identifier extends Node {
  type: 'Identifier'
  name: string
}

interface Literal extends Node {
  type: 'Literal'
  value: string | number | boolean | null
  raw: string
}

interface TemplateLiteral extends Node {
  type: 'TemplateLiteral'
  quasis: TemplateElement[]
  expressions: Expression[]
}

interface TemplateElement extends Node {
  type: 'TemplateElement'
  value: {
    raw: string
    cooked: string
  }
  tail: boolean
}

type Expression = Identifier | Literal | ObjectExpression | TemplateLiteral | Node

function isValidIdentifier(str: string): boolean {
  const identifierRegex = /^[a-z][a-z0-9]*$/i
  return identifierRegex.test(str)
}

function walk(node: Node, callback: (node: Node) => void) {
  callback(node)
  for (const key in node) {
    const value = (node as any)[key]
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach(child => {
          if (child && typeof child === 'object' && 'type' in child) {
            walk(child, callback)
          }
        })
      } else if ('type' in value) {
        walk(value, callback)
      }
    }
  }
}

function findNodeAtOffset(root: Node, offset: number): Node | null {
  let found: Node | null = null
  
  walk(root, (node) => {
    if (node.start! <= offset && offset <= node.end!) {
      if (!found || (node.start! >= found.start! && node.end! <= found.end!)) {
        found = node
      }
    }
  })
  
  return found
}

function findJSXElementWithStyleAtPosition(
  root: Node,
  offset: number
): JSXElement | null {
  let node = findNodeAtOffset(root, offset)
  
  while (node) {
    if (node.type === 'JSXElement') {
      const jsxElement = node as JSXElement
      const styleAttr = jsxElement.openingElement.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === 'style'
      ) as JSXAttribute | undefined
      
      if (styleAttr?.value?.type === 'JSXExpressionContainer') {
        const expr = styleAttr.value.expression
        if (expr.type === 'ObjectExpression') {
          return jsxElement
        }
      }
    }
    
    // Move to parent
    let parent: Node | null = null
    walk(root, (n) => {
      if (n !== node) {
        walk(n, (child) => {
          if (child === node) {
            parent = n
          }
        })
      }
    })
    node = parent
  }
  
  return null
}

function isStaticValue(node: Expression): boolean {
  return (
    node.type === 'Literal' ||
    (node.type === 'TemplateLiteral' && (node as TemplateLiteral).expressions.length === 0)
  )
}

function getStaticValue(node: Expression): string {
  if (node.type === 'Literal') {
    return String((node as Literal).value)
  } else if (node.type === 'TemplateLiteral' && (node as TemplateLiteral).expressions.length === 0) {
    return (node as TemplateLiteral).quasis[0].value.cooked
  }
  return ''
}

interface StyleExtractionResult {
  staticStyles: StyleProperty[]
  dynamicProperties: Array<{ start: number; end: number; text: string }>
}

function extractStyles(
  objectExpr: ObjectExpression,
  sourceCode: string
): StyleExtractionResult {
  const staticStyles: StyleProperty[] = []
  const dynamicProperties: Array<{ start: number; end: number; text: string }> = []

  for (const prop of objectExpr.properties) {
    if (prop.type === 'Property') {
      // Skip computed properties
      if (prop.computed) {
        dynamicProperties.push({
          start: prop.start!,
          end: prop.end!,
          text: sourceCode.slice(prop.start!, prop.end!)
        })
        continue
      }

      // Get property name
      let name: string
      if (prop.key.type === 'Identifier') {
        name = prop.key.name
      } else if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
        name = prop.key.value
      } else {
        dynamicProperties.push({
          start: prop.start!,
          end: prop.end!,
          text: sourceCode.slice(prop.start!, prop.end!)
        })
        continue
      }

      // Check if value is static
      if (isStaticValue(prop.value)) {
        staticStyles.push({
          name,
          value: getStaticValue(prop.value)
        })
      } else {
        dynamicProperties.push({
          start: prop.start!,
          end: prop.end!,
          text: sourceCode.slice(prop.start!, prop.end!)
        })
      }
    } else if (prop.type === 'SpreadElement') {
      dynamicProperties.push({
        start: prop.start!,
        end: prop.end!,
        text: sourceCode.slice(prop.start!, prop.end!)
      })
    }
  }

  return { staticStyles, dynamicProperties }
}

export function transformJsxStyleToClassName(input: TransformInput): TransformResult | null {
  const { ast, sourceCode, offset, className, classAttribute } = input

  debug('=== Transform JSX Style to ClassName ===')
  debug('Input:', { offset, className, classAttribute })
  debug('Source code:', sourceCode.substring(0, 100) + '...')

  try {
    debug('AST provided, skipping parsing')

    // Find JSX element with style at position
    const jsxElement = findJSXElementWithStyleAtPosition(ast, offset)
    debug('Found JSX element:', !!jsxElement)
    if (!jsxElement) return null

    const openingElement = jsxElement.openingElement
    const elementName = openingElement.name.name
    debug('Element name:', elementName)

    // Find style attribute
    const styleAttr = openingElement.attributes.find(
      attr => attr.type === 'JSXAttribute' && attr.name.name === 'style'
    ) as JSXAttribute | undefined
    
    debug('Style attribute found:', !!styleAttr)
    if (!styleAttr?.value) return null
    debug('Style value type:', styleAttr.value.type)
    
    if (styleAttr.value.type !== 'JSXExpressionContainer') return null
    
    const styleExpr = (styleAttr.value as JSXExpressionContainer).expression
    debug('Style expression type:', styleExpr.type)
    if (styleExpr.type !== 'ObjectExpression') return null

    // Extract styles
    const { staticStyles, dynamicProperties } = extractStyles(styleExpr as ObjectExpression, sourceCode)
    debug('Extracted static styles:', staticStyles)
    debug('Dynamic properties count:', dynamicProperties.length)
    
    // If no static styles, return result with no transformations
    if (staticStyles.length === 0) {
      return {
        transformedCode: sourceCode,
        extractedStyles: [],
        elementName,
        className
      }
    }

    // Build the transformed code
    let transformedCode = sourceCode
    const edits: Array<{ start: number; end: number; replacement: string }> = []

    debug('Style attribute position:', `${styleAttr.start}-${styleAttr.end}`)
    debug('Style attribute text:', sourceCode.slice(styleAttr.start!, styleAttr.end!))

    // Add className attribute
    const classNameValue = isValidIdentifier(className)
      ? `styles.${className}`
      : `styles["${className}"]`

    // Check if className/class attribute already exists
    const existingClassAttr = openingElement.attributes.find(
      attr => attr.type === 'JSXAttribute' && attr.name.name === classAttribute
    ) as JSXAttribute | undefined

    if (existingClassAttr) {
      // Merge with existing className
      if (existingClassAttr.value) {
        const valueStart = existingClassAttr.value.start!
        const valueEnd = existingClassAttr.value.end!
        const existingValue = sourceCode.slice(valueStart, valueEnd)
        
        if (existingValue.startsWith('{') && existingValue.endsWith('}')) {
          const inner = existingValue.slice(1, -1)
          edits.push({
            start: valueStart,
            end: valueEnd,
            replacement: `{\`\${${inner}} \${${classNameValue}}\`}`
          })
        } else {
          edits.push({
            start: valueStart,
            end: valueEnd,
            replacement: `{${classNameValue}}`
          })
        }
      }
      
      // Update or remove style attribute
      if (dynamicProperties.length > 0) {
        // Replace style object with only dynamic properties
        const dynamicPropsText = dynamicProperties.map(p => p.text).join(', ')
        edits.push({
          start: styleExpr.start!,
          end: styleExpr.end!,
          replacement: `{ ${dynamicPropsText} }`
        })
      } else {
        // Remove entire style attribute including leading space if present
        let removeStart = styleAttr.start!
        const beforeStyle = sourceCode.slice(styleAttr.start! - 1, styleAttr.start!)
        if (beforeStyle === ' ') {
          removeStart = styleAttr.start! - 1
        }
        
        edits.push({
          start: removeStart,
          end: styleAttr.end!,
          replacement: ''
        })
      }
    } else {
      // Replace style attribute with className attribute
      let removeStart = styleAttr.start!
      const beforeStyle = sourceCode.slice(styleAttr.start! - 1, styleAttr.start!)
      if (beforeStyle === ' ') {
        removeStart = styleAttr.start! - 1
      }
      
      if (dynamicProperties.length > 0) {
        // Replace with className and updated style
        const dynamicPropsText = dynamicProperties.map(p => p.text).join(', ')
        edits.push({
          start: removeStart,
          end: styleAttr.end!,
          replacement: ` ${classAttribute}={${classNameValue}} style={{ ${dynamicPropsText} }}`
        })
      } else {
        // Replace with just className
        edits.push({
          start: removeStart,
          end: styleAttr.end!,
          replacement: ` ${classAttribute}={${classNameValue}}`
        })
      }
    }

    // Apply edits in reverse order to maintain positions
    edits.sort((a, b) => b.start - a.start)
    debug('Edits to apply:', edits)
    
    for (const edit of edits) {
      debug(`Applying edit at ${edit.start}-${edit.end}: "${edit.replacement}"`)
      transformedCode = 
        transformedCode.slice(0, edit.start) + 
        edit.replacement + 
        transformedCode.slice(edit.end)
    }

    debug('Final transformed code:', transformedCode.substring(0, 200) + '...')

    return {
      transformedCode,
      extractedStyles: staticStyles,
      elementName,
      className
    }
  } catch (error) {
    console.error('Error transforming JSX:', error)
    return null
  }
}