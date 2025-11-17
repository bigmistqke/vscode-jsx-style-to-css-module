import type { TransformInput } from '../src/utils/transform-jsx-style-to-class-name'
import { describe, expect, it } from 'vitest'
import { Parser } from 'acorn'
import { tsPlugin } from '@sveltejs/acorn-typescript'
import type { Node } from 'acorn'
import {
  transformJsxStyleToClassName,
} from '../src/utils/transform-jsx-style-to-class-name'

const TypeScriptParser = Parser.extend(tsPlugin({ jsx: true }))

describe('transformJsxStyleToClassName', () => {
  it('should transform JSX element with static styles', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return (
  <div style={{ backgroundColor: 'blue', padding: '20px' }}>
    Hello World
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 100, // position within the div
      className: 'div-123',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'backgroundColor', value: 'blue' },
      { name: 'padding', value: '20px' },
    ])
    expect(result!.elementName).toBe('div')
    expect(result!.className).toBe('div-123')
    expect(result!.transformedCode).toContain('className={styles["div-123"]}')
    expect(result!.transformedCode).not.toContain('style=')
  })

  it('should handle self-closing JSX elements', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return <input style={{ border: '1px solid #ccc', padding: '8px' }} />
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 80, // position within the input
      className: 'input-456',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'border', value: '1px solid #ccc' },
      { name: 'padding', value: '8px' },
    ])
    expect(result!.elementName).toBe('input')
    expect(result!.transformedCode).toContain('className={styles["input-456"]}')
  })

  it('should handle mixed static and dynamic styles', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React, { useState } from 'react'

const Component = () => {
const [isActive] = useState(false)
const dynamicPadding = '10px'

return (
  <div style={{ 
    backgroundColor: 'red',
    color: 'white',
    padding: dynamicPadding,
    opacity: isActive ? 1 : 0.5
  }}>
    Mixed styles
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 200, // position within the div
      className: 'div-789',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'backgroundColor', value: 'red' },
      { name: 'color', value: 'white' },
    ])
    // Should keep dynamic styles in style prop
    expect(result!.transformedCode).toContain('className={styles["div-789"]}')
    expect(result!.transformedCode).toContain('style={')
    expect(result!.transformedCode).toContain('padding: dynamicPadding')
    expect(result!.transformedCode).toContain('opacity: isActive ? 1 : 0.5')
  })

  it('should handle spread properties', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
const dynamicStyles = { transform: 'scale(1.1)' }

return (
  <div style={{ 
    backgroundColor: 'green',
    color: 'white',
    ...dynamicStyles,
    padding: '15px'
  }}>
    Spread styles
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 150, // position within the div
      className: 'div-spread',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'backgroundColor', value: 'green' },
      { name: 'color', value: 'white' },
      { name: 'padding', value: '15px' },
    ])
    // Should keep spread in style prop
    expect(result!.transformedCode).toContain('style={')
    expect(result!.transformedCode).toContain('...dynamicStyles')
  })

  it('should handle Solid.js with class attribute and kebab-case', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import { Component } from 'solid-js'

const TestComponent: Component = () => {
return (
  <div style={{ 'background-color': 'purple', 'font-size': '16px' }}>
    Solid component
  </div>
)
}

export default TestComponent
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 120, // position within the div
      className: 'div-solid',
      classAttribute: 'class',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'background-color', value: 'purple' },
      { name: 'font-size', value: '16px' },
    ])
    expect(result!.transformedCode).toContain('class={styles["div-solid"]}')
    expect(result!.transformedCode).not.toContain('className=')
  })

  it('should handle template literals', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
const size = 20

return (
  <div style={{ 
    color: \`hsl(\${size * 10}, 70%, 50%)\`,
    fontSize: '16px'
  }}>
    Template literal styles
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 150, // position within the div
      className: 'div-template',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([{ name: 'fontSize', value: '16px' }])
    // Should keep template literal in style prop
    expect(result!.transformedCode).toContain('style={')
    // eslint-disable-next-line no-template-curly-in-string
    expect(result!.transformedCode).toContain('color: \`hsl(${size * 10}, 70%, 50%)\`')
  })

  it('should handle computed property names as dynamic', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return (
  <div style={{ 
    backgroundColor: 'orange',
    ['padding']: '10px',
    width: '200px'
  }}>
    Computed property
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 100, // position within the div
      className: 'div-computed',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'backgroundColor', value: 'orange' },
      { name: 'width', value: '200px' },
    ])
    // Should keep computed property name in style prop
    expect(result!.transformedCode).toContain('style={')
    expect(result!.transformedCode).toContain('[\'padding\']: \'10px\'')
  })

  it('should handle numeric literals', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return (
  <div style={{ 
    fontSize: 16,
    lineHeight: 1.5,
    zIndex: 999
  }}>
    Numeric styles
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 100, // position within the div
      className: 'div-numeric',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([
      { name: 'fontSize', value: '16' },
      { name: 'lineHeight', value: '1.5' },
      { name: 'zIndex', value: '999' },
    ])
  })

  it('should handle boolean keywords', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return (
  <div style={{ 
    display: true ? 'block' : 'none',
    visibility: false ? 'visible' : 'hidden'
  }}>
    Boolean styles
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 100, // position within the div
      className: 'div-boolean',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([])
    // All conditional expressions should remain dynamic
    expect(result!.transformedCode).toContain('style={')
  })

  it('should return null when no JSX element at position', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

// Just a comment, no JSX here
const x = 5
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 50, // position in comment
      className: 'test-class',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).toBeNull()
  })

  it('should return null when JSX element has no style prop', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return <div className="existing-class">No style prop</div>
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 80, // position within the div
      className: 'div-no-style',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).toBeNull()
  })

  it('should handle JSX fragment correctly', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return (
  <>
    <div style={{ color: 'red' }}>First</div>
    <div style={{ color: 'blue' }}>Second</div>
  </>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 100, // position within first div
      className: 'div-fragment',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([{ name: 'color', value: 'red' }])
  })

  it('should handle .jsx file extension', () => {
    const fileName = 'test.jsx'
    const fileContent = `
const Component = () => {
return <div style={{ backgroundColor: 'yellow' }}>JSX file</div>
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 50, // position within the div
      className: 'div-jsx',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([{ name: 'backgroundColor', value: 'yellow' }])
  })

  it('should handle only dynamic styles without creating class', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
const dynamicColor = 'red'

return (
  <div style={{ 
    color: dynamicColor,
    padding: someFunction()
  }}>
    Only dynamic
  </div>
)
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 150, // position within the div
      className: 'div-dynamic-only',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).not.toBeNull()
    expect(result!.extractedStyles).toEqual([])
    // Should keep all styles in style prop, no className added
    expect(result!.transformedCode).not.toContain('className=')
    expect(result!.transformedCode).toContain('style={')
  })

  it('should handle style prop with no initializer', () => {
    const fileName = 'test.tsx'
    const fileContent = `
import React from 'react'

const Component = () => {
return <div style>No initializer</div>
}

export default Component
`
    const ast = TypeScriptParser.parse(fileContent, {
      ecmaVersion: 'latest' as any,
      sourceType: 'module',
      locations: true
    }) as Node

    const input: TransformInput = {
      ast,
      sourceCode: fileContent,
      offset: 80, // position within the div
      className: 'div-no-init',
      classAttribute: 'className',
    }

    const result = transformJsxStyleToClassName(input)
    expect(result).toBeNull()
  })
})
