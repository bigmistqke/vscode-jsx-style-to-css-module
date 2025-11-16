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

export function generateRandomClassName(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `style-${result}`
}