import { describe, expect, it } from 'vitest'
import { Parser } from 'acorn'
import { tsPlugin } from '@sveltejs/acorn-typescript'
import type { Node } from 'acorn'
import { getJsxElementNameAtPosition } from '../src/utils/get-jsx-element-name-at-position'

const TypeScriptParser = Parser.extend(tsPlugin({ jsx: true }))

describe('getJsxElementNameAtPosition', () => {
  it('should get element name for div', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
  return <div style={{ color: 'red' }}>Hello</div>
}
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node
    const elementName = getJsxElementNameAtPosition(ast, 80)
    expect(elementName).toBe('div')
  })

  it('should get element name for self-closing element', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
  return <input style={{ border: '1px solid #ccc' }} />
}
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node
    const elementName = getJsxElementNameAtPosition(ast, 80)
    expect(elementName).toBe('input')
  })

  it('should get element name for custom component', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
  return <Button style={{ padding: '10px' }}>Click me</Button>
}
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node
    const elementName = getJsxElementNameAtPosition(ast, 80)
    expect(elementName).toBe('Button')
  })

  it('should return null when no element at position', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const x = 5 // No JSX here
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node
    const elementName = getJsxElementNameAtPosition(ast, 40)
    expect(elementName).toBeNull()
  })

  it('should work for elements without style prop', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
  return <div className="test">No style</div>
}
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node
    const elementName = getJsxElementNameAtPosition(ast, 80)
    expect(elementName).toBe('div')
  })
})
