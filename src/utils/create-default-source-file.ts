import * as ts from 'typescript'

/**
 * Create a TypeScript source file from content
 */
export function createDefaultSourceFile(fileName: string, fileContent: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(fileName),
  )
}

function getScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (fileName.endsWith('.ts')) return ts.ScriptKind.TS
  return ts.ScriptKind.JS
}
