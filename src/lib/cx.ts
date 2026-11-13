import { extendTailwindMerge } from 'tailwind-merge';

const merge = extendTailwindMerge({
  extend: { theme: { radius: ['field', 'tile', 'card'], shadow: ['card', 'button'] } },
});

export function cx(...classes: (string | false | null | undefined)[]): string {
  return merge(classes);
}
