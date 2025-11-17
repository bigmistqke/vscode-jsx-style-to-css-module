import type { Node } from 'acorn'
import type { JSXElement } from './acorn-utils'
import { findNodeAtOffset, walk } from './acorn-utils'

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
