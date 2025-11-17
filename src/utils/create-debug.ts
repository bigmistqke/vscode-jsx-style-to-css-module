export function createDebug(subject: string, enabled: boolean) {
  return function (value: string, extra?: any, options?: { trace?: boolean }) {
    if (!enabled) {
      return
    }
    // eslint-disable-next-line no-console
    console[options?.trace ? 'trace' : 'log'](
      `%c[${subject}]`,
      `color: grey;`,
      value,
      ...[extra].filter(Boolean),
    )
  }
}
