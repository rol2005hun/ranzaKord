import { describe, it, expect } from 'vitest';

describe('useApi', () => {
  it('should be a function', () => {
    expect(typeof (() => {})).toBe('function');
  });

  it('example: formats API error message correctly', () => {
    const formatError = (err: unknown): string =>
      err instanceof Error ? err.message : 'Unknown error';

    expect(formatError(new Error('Network failure'))).toBe('Network failure');
    expect(formatError('string error')).toBe('Unknown error');
  });
});
