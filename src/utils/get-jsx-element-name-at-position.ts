import type { Node } from 'acorn'

interface JSXElement extends Node {
  type: 'JSXElement'
  openingElement: JSXOpeningElement
}

interface JSXOpeningElement extends Node {
  type: 'JSXOpeningElement'
  name: JSXIdentifier
  selfClosing: boolean
}

interface JSXIdentifier extends Node {
  type: 'JSXIdentifier'
  name: string
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

/**
 * Get the JSX element tag name at a specific position
 */
export function getJsxElementNameAtPosition(ast: Node, offset: number): string | null {
  try {
    let node = findNodeAtOffset(ast, offset)
    
    while (node) {
      if (node.type === 'JSXElement') {
        const jsxElement = node as JSXElement
        return jsxElement.openingElement.name.name
      }
      
      // Move to parent
      let parent: Node | null = null
      walk(ast, (n) => {
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
  catch (error) {
    console.error('Error getting JSX element name:', error)
    return null
  }
}
