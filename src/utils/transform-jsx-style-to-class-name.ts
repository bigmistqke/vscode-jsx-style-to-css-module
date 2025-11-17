import type { Node } from 'acorn'
import type { JSXElement, JSXExpressionContainer, ObjectExpression } from './acorn-utils'
import { findNodeAtOffset, getStaticValue, isIdentifier, isJSXAttribute, isJSXExpressionContainer, isLiteral, isObjectExpression, isProperty, isSpreadElement, isStaticValue, isValidIdentifier, walk } from './acorn-utils'
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

export interface StyleExtractionResult {
  staticProperties: StyleProperty[]
  dynamicProperties: Array<{ start: number, end: number, text: string }>
}

function findJSXElementWithStyleAtPosition(
  root: Node,
  offset: number,
): JSXElement | null {
  let node = findNodeAtOffset(root, offset)

  while (node) {
    if (node.type === 'JSXElement') {
      const jsxElement = node as JSXElement
      const styleAttr = jsxElement.openingElement.attributes.find(
        attr => isJSXAttribute(attr) && attr.name.name === 'style',
      )

      if (isJSXExpressionContainer(styleAttr?.value)) {
        const expr = styleAttr.value.expression
        if (isObjectExpression(expr)) {
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

function extractStyles(
  objectExpr: ObjectExpression,
  sourceCode: string,
): StyleExtractionResult {
  const staticProperties: Array<StyleProperty> = []
  const dynamicProperties: Array<{ start: number, end: number, text: string }> = []

  for (const prop of objectExpr.properties) {
    if (isSpreadElement(prop)) {
      dynamicProperties.push({
        start: prop.start!,
        end: prop.end!,
        text: sourceCode.slice(prop.start!, prop.end!),
      })
      continue
    }

    if (isProperty(prop)) {
      // Skip computed properties
      if (prop.computed) {
        dynamicProperties.push({
          start: prop.start!,
          end: prop.end!,
          text: sourceCode.slice(prop.start!, prop.end!),
        })
        continue
      }

      // Get property name
      let name: string
      if (isIdentifier(prop.key)) {
        name = prop.key.name
      }
      else if (isLiteral(prop.key) && typeof prop.key.value === 'string') {
        name = prop.key.value
      }
      else {
        dynamicProperties.push({
          start: prop.start!,
          end: prop.end!,
          text: sourceCode.slice(prop.start!, prop.end!),
        })
        continue
      }

      // Check if value is static
      if (isStaticValue(prop.value)) {
        staticProperties.push({
          name,
          value: getStaticValue(prop.value),
        })
      }
      else {
        dynamicProperties.push({
          start: prop.start!,
          end: prop.end!,
          text: sourceCode.slice(prop.start!, prop.end!),
        })
      }
    }
  }

  return { staticProperties, dynamicProperties }
}

/**********************************************************************************/
/*                                                                                */
/*                        Transform JSX Style To Class Name                       */
/*                                                                                */
/**********************************************************************************/

export function transformJsxStyleToClassName({ ast, sourceCode, offset, className, classAttribute }: TransformInput): TransformResult | null {
  debug('=== Transform JSX Style to ClassName ===')
  debug('Input:', { offset, className, classAttribute })
  debug('Source code:', `${sourceCode.substring(0, 100)}...`)

  try {
    // Find JSX element with style at position
    const jsxElement = findJSXElementWithStyleAtPosition(ast, offset)
    debug('Found JSX element:', !!jsxElement)
    if (!jsxElement)
      return null

    const openingElement = jsxElement.openingElement
    const elementName = openingElement.name.name
    debug('Element name:', elementName)

    // Find style attribute
    const styleAttr = openingElement.attributes.find(
      attr => isJSXAttribute(attr) && attr.name.name === 'style',
    )

    debug('Style attribute found:', !!styleAttr)
    if (!styleAttr?.value)
      return null
    debug('Style value type:', styleAttr.value.type)

    if (styleAttr.value.type !== 'JSXExpressionContainer')
      return null

    const styleExpr = (styleAttr.value as JSXExpressionContainer).expression
    debug('Style expression type:', styleExpr.type)
    if (!isObjectExpression(styleExpr))
      return null

    // Extract styles
    const { staticProperties: staticStyles, dynamicProperties } = extractStyles(styleExpr, sourceCode)
    debug('Extracted static styles:', staticStyles)
    debug('Dynamic properties count:', dynamicProperties.length)

    // If no static styles, return result with no transformations
    if (staticStyles.length === 0) {
      return {
        transformedCode: sourceCode,
        extractedStyles: [],
        elementName,
        className,
      }
    }

    // Build the transformed code
    let transformedCode = sourceCode
    const edits: Array<{ start: number, end: number, replacement: string }> = []

    debug('Style attribute position:', `${styleAttr.start}-${styleAttr.end}`)
    debug('Style attribute text:', sourceCode.slice(styleAttr.start!, styleAttr.end!))

    // Add className attribute
    const classNameValue = isValidIdentifier(className)
      ? `styles.${className}`
      : `styles["${className}"]`

    // Simply replace style attribute with className attribute
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
        replacement: ` ${classAttribute}={${classNameValue}} style={{ ${dynamicPropsText} }}`,
      })
    }
    else {
      // Replace with just className
      edits.push({
        start: removeStart,
        end: styleAttr.end!,
        replacement: ` ${classAttribute}={${classNameValue}}`,
      })
    }

    // Apply edits in reverse order to maintain positions
    edits.sort((a, b) => b.start - a.start)
    debug('Edits to apply:', edits)

    for (const edit of edits) {
      debug(`Applying edit at ${edit.start}-${edit.end}: "${edit.replacement}"`)
      transformedCode
        = transformedCode.slice(0, edit.start)
          + edit.replacement
          + transformedCode.slice(edit.end)
    }

    debug('Final transformed code:', `${transformedCode.substring(0, 200)}...`)

    return {
      transformedCode,
      extractedStyles: staticStyles,
      elementName,
      className,
    }
  }
  catch (error) {
    console.error('Error transforming JSX:', error)
    return null
  }
}
