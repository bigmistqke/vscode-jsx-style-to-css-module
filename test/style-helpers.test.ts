import { describe, expect, it } from 'vitest'
import {
  camelToKebab,
  classExistsInCSS,
  generateRandomClassName,
  generateUniqueClassName,
  parseStyleObject,
  stylesToCSS,
} from '../src/utils/style-helpers'

describe('style-helpers', () => {
  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('backgroundColor')).toBe('background-color')
      expect(camelToKebab('marginTop')).toBe('margin-top')
      expect(camelToKebab('paddingLeft')).toBe('padding-left')
      expect(camelToKebab('borderBottomWidth')).toBe('border-bottom-width')
    })

    it('should handle single word properties', () => {
      expect(camelToKebab('color')).toBe('color')
      expect(camelToKebab('width')).toBe('width')
      expect(camelToKebab('height')).toBe('height')
    })

    it('should handle properties with numbers', () => {
      expect(camelToKebab('zIndex1')).toBe('z-index1')
      expect(camelToKebab('margin2Top')).toBe('margin2-top')
    })

    it('should handle empty string', () => {
      expect(camelToKebab('')).toBe('')
    })
  })

  describe('parseStyleObject', () => {
    it('should parse simple style object string', () => {
      const input = 'backgroundColor: "blue", padding: "20px"'
      const expected = {
        backgroundColor: 'blue',
        padding: '20px',
      }
      expect(parseStyleObject(input)).toEqual(expected)
    })

    it('should parse style object with curly braces', () => {
      const input = '{ fontSize: "16px", color: "red" }'
      const expected = {
        fontSize: '16px',
        color: 'red',
      }
      expect(parseStyleObject(input)).toEqual(expected)
    })

    it('should handle numeric values with units', () => {
      const input = 'width: 100px, height: 50%, marginTop: 2em'
      const expected = {
        width: '100px',
        height: '50%',
        marginTop: '2em',
      }
      expect(parseStyleObject(input)).toEqual(expected)
    })

    it('should handle single quotes', () => {
      const input = 'backgroundColor: \'blue\', color: \'white\''
      const expected = {
        backgroundColor: 'blue',
        color: 'white',
      }
      expect(parseStyleObject(input)).toEqual(expected)
    })

    it('should handle backticks', () => {
      const input = 'backgroundColor: `blue`, color: `white`'
      const expected = {
        backgroundColor: 'blue',
        color: 'white',
      }
      expect(parseStyleObject(input)).toEqual(expected)
    })

    it('should handle empty input', () => {
      expect(parseStyleObject('')).toEqual({})
      expect(parseStyleObject('{}')).toEqual({})
    })

    it('should handle values without quotes', () => {
      const input = 'margin: 0, padding: 10'
      const expected = {
        margin: '0',
        padding: '10',
      }
      expect(parseStyleObject(input)).toEqual(expected)
    })
  })

  describe('stylesToCSS', () => {
    describe('kebab-case mode', () => {
      it('should convert style object to CSS string with kebab-case', () => {
        const input = {
          backgroundColor: 'blue',
          marginTop: '10px',
          paddingLeft: '20px',
        }
        const expected = `  background-color: blue;
  margin-top: 10px;
  padding-left: 20px;`
        expect(stylesToCSS(input)).toBe(expected)
        expect(stylesToCSS(input, 'kebab-case')).toBe(expected)
      })

      it('should handle single property', () => {
        const input = {
          color: 'red',
        }
        const expected = '  color: red;'
        expect(stylesToCSS(input)).toBe(expected)
      })

      it('should handle empty object', () => {
        expect(stylesToCSS({})).toBe('')
      })

      it('should preserve numeric values', () => {
        const input = {
          zIndex: '999',
          opacity: '0.5',
        }
        const expected = `  z-index: 999;
  opacity: 0.5;`
        expect(stylesToCSS(input)).toBe(expected)
      })
    })

    describe('camelCase mode', () => {
      it('should preserve camelCase properties', () => {
        const input = {
          backgroundColor: 'blue',
          marginTop: '10px',
          paddingLeft: '20px',
        }
        const expected = `  backgroundColor: blue;
  marginTop: 10px;
  paddingLeft: 20px;`
        expect(stylesToCSS(input, 'camelCase')).toBe(expected)
      })

      it('should handle single property in camelCase', () => {
        const input = {
          fontSize: '16px',
        }
        const expected = '  fontSize: 16px;'
        expect(stylesToCSS(input, 'camelCase')).toBe(expected)
      })

      it('should handle properties that are already kebab-case compatible', () => {
        const input = {
          color: 'red',
          width: '100px',
        }
        const expected = `  color: red;
  width: 100px;`
        expect(stylesToCSS(input, 'camelCase')).toBe(expected)
      })
    })
  })

  describe('generateRandomClassName', () => {
    it('should generate class name with default element prefix when no tag provided', () => {
      const className = generateRandomClassName()
      expect(className).toMatch(/^element-\d{1,3}$/)
    })

    it('should generate class name with tag name prefix when provided', () => {
      const className = generateRandomClassName('div')
      expect(className).toMatch(/^div-\d{1,3}$/)

      const buttonClass = generateRandomClassName('button')
      expect(buttonClass).toMatch(/^button-\d{1,3}$/)

      const h1Class = generateRandomClassName('h1')
      expect(h1Class).toMatch(/^h1-\d{1,3}$/)
    })

    it('should generate unique class names', () => {
      const classNames = new Set()
      // Generate 50 class names and check most are unique (allowing for some collisions with 0-999)
      for (let i = 0; i < 50; i++) {
        classNames.add(generateRandomClassName('div'))
      }
      expect(classNames.size).toBeGreaterThan(40)
    })

    it('should generate numbers between 0 and 999', () => {
      for (let i = 0; i < 20; i++) {
        const className = generateRandomClassName('test')
        const num = Number.parseInt(className.replace('test-', ''))
        expect(num).toBeGreaterThanOrEqual(0)
        expect(num).toBeLessThan(1000)
      }
    })
  })

  describe('classExistsInCSS', () => {
    it('should detect existing class in CSS', () => {
      const css = `.button-123 { color: red; }\n.div-456 { margin: 10px; }`
      expect(classExistsInCSS(css, 'button-123')).toBe(true)
      expect(classExistsInCSS(css, 'div-456')).toBe(true)
      expect(classExistsInCSS(css, 'span-789')).toBe(false)
    })

    it('should handle CSS with different formatting', () => {
      const css = `.button-123{color:red;}.div-456  {  margin: 10px;  }`
      expect(classExistsInCSS(css, 'button-123')).toBe(true)
      expect(classExistsInCSS(css, 'div-456')).toBe(true)
    })

    it('should not match partial class names', () => {
      const css = `.button-123 { color: red; }`
      expect(classExistsInCSS(css, 'button')).toBe(false)
      expect(classExistsInCSS(css, '123')).toBe(false)
    })
  })

  describe('generateUniqueClassName', () => {
    it('should generate unique class name when no conflicts', () => {
      const css = ''
      const className = generateUniqueClassName(css, 'div')
      expect(className).toMatch(/^div-\d{1,3}$/)
    })

    it('should generate new name when conflicts exist', () => {
      // Mock CSS with some existing classes
      const css = `.div-100 { color: red; }\n.div-200 { margin: 10px; }`

      // Generate multiple class names to ensure we don't get conflicts
      const classNames = new Set()
      for (let i = 0; i < 10; i++) {
        const className = generateUniqueClassName(css, 'div')
        expect(className).not.toBe('div-100')
        expect(className).not.toBe('div-200')
        classNames.add(className)
      }

      // Check they're all unique
      expect(classNames.size).toBe(10)
    })

    it('should throw error after max retries', () => {
      // Create CSS with all possible class names (0-999)
      let css = ''
      for (let i = 0; i < 1000; i++) {
        css += `.test-${i} { color: red; }\n`
      }

      expect(() => generateUniqueClassName(css, 'test', 10)).toThrow('Max retries generating unique class name')
    })

    it('should use default element prefix when no tag provided', () => {
      const css = ''
      const className = generateUniqueClassName(css)
      expect(className).toMatch(/^element-\d{1,3}$/)
    })
  })
})
