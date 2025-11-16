import { Project, SourceFile } from 'ts-morph'

/**
 * Create a TypeScript source file from content
 */
/**
 * Create a ts-morph source file from content
 */
export function createSourceFile(fileName: string, fileContent: string): SourceFile {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      jsx:
        fileName.endsWith('.tsx') || fileName.endsWith('.jsx')
          ? 2 // JSX.React
          : undefined,
    },
  })
  return project.createSourceFile(fileName, fileContent)
}
