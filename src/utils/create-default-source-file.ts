import type { SourceFile } from 'ts-morph'
import * as path from 'node:path'
import { Project } from 'ts-morph'
import * as ts from 'typescript'

/**
 * Create a ts-morph source file from content using project's tsconfig
 */
export function createDefaultSourceFile(fileName: string, fileContent: string): SourceFile {
  const compilerOptions = getCompilerOptions(fileName)

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions,
  })

  return project.createSourceFile(fileName, fileContent)
}

/**
 * Get TypeScript compiler options from the nearest tsconfig.json
 */
function getCompilerOptions(fileName: string): ts.CompilerOptions {
  try {
    const directory = path.dirname(path.resolve(fileName))

    // Find the nearest tsconfig.json using TypeScript's API
    const configFileName = ts.findConfigFile(directory, ts.sys.fileExists, 'tsconfig.json')

    if (!configFileName) {
      // Fallback to default options for JSX files
      return getDefaultCompilerOptions(fileName)
    }

    // Read and parse the tsconfig.json
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile)

    if (configFile.error) {
      console.warn('Error reading tsconfig.json:', configFile.error.messageText)
      return getDefaultCompilerOptions(fileName)
    }

    // Parse the config file content to get resolved compiler options
    const parsedCommandLine = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configFileName),
    )

    if (parsedCommandLine.errors.length > 0) {
      console.warn(
        'Errors in tsconfig.json:',
        parsedCommandLine.errors.map(e => e.messageText),
      )
    }

    return parsedCommandLine.options
  }
  catch (error) {
    console.warn('Error getting compiler options from tsconfig.json:', error)
    return getDefaultCompilerOptions(fileName)
  }
}

/**
 * Get default compiler options when tsconfig.json is not found or fails to parse
 */
function getDefaultCompilerOptions(fileName: string): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    jsx: fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.JsxEmit.React : undefined,
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false, // Don't enforce strict mode for parsing
  }
}
