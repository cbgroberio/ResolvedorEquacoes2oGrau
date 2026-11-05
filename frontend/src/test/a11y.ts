import { expect } from '@jest/globals';
import axe from 'axe-core';

export async function expectNoA11yViolations(
  container: HTMLElement,
): Promise<void> {
  const results = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  });
  expect(results.violations.map((v) => v.id)).toEqual([]);
}

