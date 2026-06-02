import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{jsx,js}', { ignore: ['**/node_modules/**', '**/lib/theme.js', '**/lib/useTheme.js'] });

let count = 0;
for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;

  // 1. Replace import: add useTheme if getTheme is imported from lib/theme
  content = content.replace(
    /import\s*\{\s*([^}]*)\}\s*from\s*(['"])\.\.\/lib\/theme\2/g,
    (match, imports, quote) => {
      if (!imports.includes('getTheme')) return match;
      if (!imports.includes('useTheme')) {
        return `import { ${imports.trim()}, useTheme } from ${quote}../lib/theme${quote}`;
      }
      return match;
    }
  );

  // 2. Replace destructured t pattern
  content = content.replace(
    /const\s*\{\s*t\s*\}\s*=\s*useMemo\s*\(\s*\(\)\s*=>\s*getTheme\s*\(\s*isDark\s*\)\s*,\s*\[\s*isDark\s*\]\s*\)/g,
    'const t = useTheme(isDark)'
  );

  // 3. Replace direct t = useMemo pattern
  content = content.replace(
    /const\s+t\s*=\s*useMemo\s*\(\s*\(\)\s*=>\s*getTheme\s*\(\s*isDark\s*\)\s*,\s*\[\s*isDark\s*\]\s*\)/g,
    'const t = useTheme(isDark)'
  );

  // 4. Replace theme = getTheme(isDark) pattern (not memoized)
  content = content.replace(
    /const\s+theme\s*=\s*getTheme\s*\(\s*isDark\s*\)/g,
    'const theme = getTheme(isDark)'
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    count++;
    console.log(`✓ ${file}`);
  }
}

console.log(`\n✅ ${count} files updated.`);
