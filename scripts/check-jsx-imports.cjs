const fs = require('fs');
let bad = 0;
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(f, 'utf8');
  const imp = new Set();
  (s.match(/import\s+(?:[\w$]+\s*,\s*)?\{([^}]+)\}\s*from/g) || []).forEach(m =>
    m.replace(/import\s+(?:[\w$]+\s*,\s*)?\{|\}\s*from/g, '').split(',').forEach(x => imp.add(x.trim().split(/\s+as\s+/).pop())));
  (s.match(/import\s+([\w$]+)\s*(?:,|from)/g) || []).forEach(m => imp.add(m.replace(/import\s+|\s*,|\s*from/g, '').trim()));
  const defs = new Set((s.match(/(?:const|function|class|let|var)\s+([A-Z]\w*)/g) || []).map(x => x.split(/\s+/).pop()));
  const params = new Set((s.match(/\{\s*icon:\s*([A-Z]\w*)/g) || []).map(x => x.split(':').pop().trim()));
  (s.match(/const\s+Icon\s*=/g) || []).forEach(() => defs.add('Icon'));
  const used = [...new Set((s.match(/<([A-Z]\w*)/g) || []).map(x => x.slice(1)))];
  const miss = used.filter(u => !imp.has(u) && !defs.has(u) && !params.has(u) && u !== 'Fragment');
  console.log(f + ': ' + (miss.length ? 'FALTAN ' + miss.join(', ') : 'OK'));
  if (miss.length) bad++;
}
process.exit(bad ? 1 : 0);
