import type { Node } from 'acorn'

type Nullable<T> = T | null | undefined

export interface JSXElement extends Node {
  type: 'JSXElement'
  openingElement: JSXOpeningElement
  closingElement: JSXClosingElement | null
  children: Node[]
}

export interface JSXOpeningElement extends Node {
  type: 'JSXOpeningElement'
  name: JSXIdentifier
  attributes: JSXAttribute[]
  selfClosing: boolean
}

export interface JSXClosingElement extends Node {
  type: 'JSXClosingElement'
  name: JSXIdentifier
}

export interface JSXIdentifier extends Node {
  type: 'JSXIdentifier'
  name: string
}

export interface JSXAttribute extends Node {
  type: 'JSXAttribute'
  name: JSXIdentifier
  value: JSXExpressionContainer | Literal | null
}

export interface JSXExpressionContainer extends Node {
  type: 'JSXExpressionContainer'
  expression: Expression
}

export interface ObjectExpression extends Node {
  type: 'ObjectExpression'
  properties: (Property | SpreadElement)[]
}

export interface Property extends Node {
  type: 'Property'
  key: Identifier | Literal
  value: Expression
  computed: boolean
  kind: 'init' | 'get' | 'set'
}

export interface SpreadElement extends Node {
  type: 'SpreadElement'
  argument: Expression
}

export interface Identifier extends Node {
  type: 'Identifier'
  name: string
}

export interface Literal extends Node {
  type: 'Literal'
  value: string | number | boolean | null
  raw: string
}

export interface TemplateLiteral extends Node {
  type: 'TemplateLiteral'
  quasis: TemplateElement[]
  expressions: Expression[]
}

export interface TemplateElement extends Node {
  type: 'TemplateElement'
  value: {
    raw: string
    cooked: string
  }
  tail: boolean
}

type Expression = Identifier | Literal | ObjectExpression | TemplateLiteral | Node

/**********************************************************************************/
/*                                                                                */
/*                                       Misc                                     */
/*                                                                                */
/**********************************************************************************/

export function getStaticValue(node: Expression): string {
  if (isLiteral(node)) {
    return String((node as Literal).value)
  }
  else if (isTemplateLiteral(node) && node.expressions.length === 0) {
    return node.quasis[0].value.cooked
  }
  return ''
}
export function findNodeAtOffset(root: Node, offset: number): Node | null {
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

export function walk(node: Node, callback: (node: Node) => void) {
  callback(node)
  for (const key in node) {
    const value = (node as any)[key]
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === 'object' && 'type' in child) {
            walk(child, callback)
          }
        })
      }
      else if ('type' in value) {
        walk(value, callback)
      }
    }
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                      Guards                                    */
/*                                                                                */
/**********************************************************************************/

export function isValidIdentifier(str: string): boolean {
  const identifierRegex = /^[a-z][a-z0-9]*$/i
  return identifierRegex.test(str)
}

export function isStaticValue(node: Expression): boolean {
  return (
    node.type === 'Literal'
    || (node.type === 'TemplateLiteral' && (node as TemplateLiteral).expressions.length === 0)
  )
}

export function isIdentifier(node: Nullable<Node>): node is Identifier {
  return node?.type === 'Identifier'
}

export function isLiteral(node: Nullable<Node>): node is Literal {
  return node?.type === 'Literal'
}

export function isTemplateLiteral(node: Nullable<Node>): node is TemplateLiteral {
  return node?.type === 'TemplateLiteral'
}

export function isProperty(node: Nullable<Node>): node is Property {
  return node?.type === 'Property'
}

export function isSpreadElement(node: Nullable<Node>): node is SpreadElement {
  return node?.type === 'SpreadElement'
}

export function isJSXExpressionContainer(node?: Nullable<Node>): node is JSXExpressionContainer {
  return node?.type === 'JSXExpressionContainer'
}
export function isJSXAttribute(node: Nullable<Node>): node is JSXAttribute {
  return node?.type === 'JSXAttribute'
}

export function isObjectExpression(node: Nullable<Node>): node is ObjectExpression {
  return node?.type === 'ObjectExpression'
}
