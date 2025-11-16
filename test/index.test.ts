import { describe, expect, it } from 'vitest'
import {
  camelToKebab,
  generateRandomClassName,
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
      const input = "backgroundColor: 'blue', color: 'white'"
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
    it('should generate class name with correct prefix', () => {
      const className = generateRandomClassName()
      expect(className).toMatch(/^style-[a-z]{8}$/)
    })

    it('should generate unique class names', () => {
      const classNames = new Set()
      // Generate 100 class names and check they're all unique
      for (let i = 0; i < 100; i++) {
        classNames.add(generateRandomClassName())
      }
      expect(classNames.size).toBe(100)
    })

    it('should only use lowercase letters', () => {
      const className = generateRandomClassName()
      const suffix = className.replace('style-', '')
      expect(suffix).toMatch(/^[a-z]+$/)
    })

    it('should always have length of 14 characters', () => {
      const className = generateRandomClassName()
      expect(className.length).toBe(14) // 'style-' (6) + 8 random chars
    })
  })
})