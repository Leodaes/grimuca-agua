// Static repo checks: no workflows, no "potable", no obvious secrets.
// Usage: node pruebas/externas/revisar-repo.js  (from the repo root)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = execSync('git rev-parse --show-toplevel').toString().trim();
const files = execSync('git ls-files', { cwd: root }).toString().split('\n').filter(Boolean)
  .filter(f => !f.startsWith('pruebas/externas/') && !f.startsWith('docs/calidad/externo/'));

const problems = [];
if (fs.existsSync(path.join(root, '.github', 'workflows'))) problems.push('Existe la carpeta .github/workflows');

const secretRes = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'llave privada'],
  [/\b(sk|pk)_(live|test)_[A-Za-z0-9]{10,}/, 'llave de pagos'],
  [/\bsk-[A-Za-z0-9_-]{20,}/, 'llave de API'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'token de GitHub'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'llave de AWS'],
  [/(password|passwd|secret|api_key|apikey|token)\s*[:=]\s*['"][^'"\s]{8,}['"]/i, 'credencial escrita en el código'],
  [/\b0?4(12|14|16|24|26)[-\s]?\d{3}[-\s]?\d{4}\b/, 'posible teléfono venezolano real'],
];
const textExt = /\.(js|jsx|ts|tsx|json|md|html|css|env|yml|yaml|txt|py|sh|sql)$|^\.env/;

for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.example')) problems.push(`Archivo de entorno versionado: ${f}`);
  if (!textExt.test(path.basename(f))) continue;
  const body = fs.readFileSync(path.join(root, f), 'utf8');
  for (const [re, label] of secretRes) if (re.test(body)) problems.push(`${label} en ${f}`);
  if (/potable/i.test(body) && !f.startsWith('docs/')) problems.push(`La palabra "potable" aparece en ${f}`);
}

if (problems.length) { console.log('PROBLEMAS:\n- ' + problems.join('\n- ')); process.exitCode = 1; }
else console.log(`OK: ${files.length} archivos revisados, sin hallazgos.`);

// self-check of the patterns
if (require.main === module && process.env.AUTOTEST) {
  const assert = require('assert');
  assert(secretRes[0][0].test('-----BEGIN RSA PRIVATE KEY-----'));
  assert(secretRes[6][0].test('0414-555-1234'));
  assert(!secretRes[6][0].test('version 1.2.3'));
  console.log('autotest ok');
}
