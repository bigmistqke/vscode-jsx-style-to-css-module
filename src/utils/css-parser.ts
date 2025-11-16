import * as fs from 'node:fs'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

export interface CSSClass {
  name: string
  startLine: number
  endLine: number
  startColumn: number
  endColumn: number
}

/**
 * Parse CSS file and extract all class names with their positions
 */
export function parseCSSFile(filePath: string): CSSClass[] {
  if (!fs.existsSync(filePath)) {
    return []
  }

  try {
    const cssContent = fs.readFileSync(filePath, 'utf8')
    return parseCSSContent(cssContent)
  } catch (error) {
    console.error('Error reading CSS file:', error)
    return []
  }
}

/**
 * Parse CSS content and extract all class names with their positions
 */
export function parseCSSContent(cssContent: string): CSSClass[] {
  const classes: CSSClass[] = []

  try {
    const ast = postcss.parse(cssContent)

    ast.walkRules((rule) => {
      // Parse each selector in the rule
      selectorParser((selectors) => {
        selectors.walkClasses((classNode) => {
          const className = classNode.value
          
          if (rule.source?.start && rule.source?.end) {
            classes.push({
              name: className,
              startLine: rule.source.start.line,
              endLine: rule.source.end.line,
              startColumn: rule.source.start.column,
              endColumn: rule.source.end.column,
            })
          }
        })
      }).processSync(rule.selector)
    })
  } catch (error) {
    console.error('Error parsing CSS content:', error)
  }

  return classes
}

/**
 * Check if a class name already exists in the CSS content
 */
export function classExists(cssContent: string, className: string): boolean {
  const classes = parseCSSContent(cssContent)
  return classes.some(cls => cls.name === className)
}

/**
 * Find the position of a specific class in CSS content
 */
export function findClassPosition(cssContent: string, className: string): CSSClass | null {
  const classes = parseCSSContent(cssContent)
  return classes.find(cls => cls.name === className) || null
}