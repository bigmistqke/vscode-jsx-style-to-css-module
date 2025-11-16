import { describe, it, expect } from 'vitest'
import { createDefaultSourceFile } from '../src/utils/create-default-source-file'
import { getJsxElementNameAtPosition } from '../src/utils/get-jsx-element-name-at-position'

describe('getJsxElementNameAtPosition', () => {
  it('should get element name for div', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
  return <div style={{ color: 'red' }}>Hello</div>
}
`
    const sourceFile = createDefaultSourceFile(fileName, fileContent)
    const elementName = getJsxElementNameAtPosition(sourceFile, 80)
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
    const sourceFile = createDefaultSourceFile(fileName, fileContent)
    const elementName = getJsxElementNameAtPosition(sourceFile, 80)
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
    const sourceFile = createDefaultSourceFile(fileName, fileContent)
    const elementName = getJsxElementNameAtPosition(sourceFile, 80)
    expect(elementName).toBe('Button')
  })

  it('should return null when no element at position', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const x = 5 // No JSX here
`
    const sourceFile = createDefaultSourceFile(fileName, fileContent)
    const elementName = getJsxElementNameAtPosition(sourceFile, 40)
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
    const sourceFile = createDefaultSourceFile(fileName, fileContent)
    const elementName = getJsxElementNameAtPosition(sourceFile, 80)
    expect(elementName).toBe('div')
  })
})
