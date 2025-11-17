export interface StyleObject {
  [key: string]: string
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function parseStyleObject(styleStr: string): StyleObject {
  const styles: StyleObject = {}

  // Remove outer braces if present
  styleStr = styleStr.trim()
  if (styleStr.startsWith('{') && styleStr.endsWith('}')) {
    styleStr = styleStr.slice(1, -1)
  }

  // Split by comma, but not commas inside quotes
  const styleEntries = styleStr.match(/(\w+):\s*(['"`].*?['"`]|\d+(?:px|em|rem|%)?)/g) || []

  styleEntries.forEach((entry) => {
    const [key, value] = entry.split(':').map(s => s.trim())
    if (key && value) {
      styles[key] = value.replace(/['"`]/g, '')
    }
  })

  return styles
}

export function stylesToCSS(styles: StyleObject, propertyNaming: 'kebab-case' | 'camelCase' = 'kebab-case'): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      const propertyName = propertyNaming === 'kebab-case' ? camelToKebab(key) : key
      return `  ${propertyName}: ${value};`
    })
    .join('\n')
}

export function generateRandomClassName(tagName?: string): string {
  const randomNum = Math.floor(Math.random() * 1000)
  const baseTag = tagName || 'element'
  return `${baseTag}-${randomNum}`
}

export function classExistsInCSS(cssContent: string, className: string): boolean {
  // Check if the class name exists as a CSS selector
  const classRegex = new RegExp(`\\.${className}\\s*\\{`, 'g')
  return classRegex.test(cssContent)
}

export function generateUniqueClassName(
  cssContent: string,
  tagName?: string,
  maxRetries: number = 100,
) {
  let attempts = 0
  let className = generateRandomClassName(tagName)

  while (classExistsInCSS(cssContent, className) && attempts < maxRetries) {
    className = generateRandomClassName(tagName)
    attempts++
  }

  if (attempts >= maxRetries) {
    throw new Error('Max retries generating unique class name')
  }

  return className
}
