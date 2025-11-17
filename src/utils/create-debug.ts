export function createDebug(subject: string, enabled: boolean) {
  return function (value: string, extra?: any, options?: { trace?: boolean }) {
    if (!enabled) {
      return
    }
    console[options?.trace ? 'trace' : 'log'](
      `%c[${subject}]`,
      `color: grey;`,
      value,
      ...[extra].filter(Boolean),
    )
  }
}
