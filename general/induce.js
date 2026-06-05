/**
 * induce.js
 *
 * End-to-end general-text template induction — the full Wring pipeline on an
 * arbitrary document:
 *
 *   Tokenize (Stage 1) → Grammar (Stage 2) → Bookend Merge + MDL (Stages 3–4)
 *   → reconstruction check (Stage 5)
 *
 * This is the first time the pipeline runs end-to-end on free text rather than
 * pre-segmented DOM signatures. The connective tissue is the *bridge*: it turns
 * the grammar into a set of "records" (near-repeated spans) and feeds them to
 * Bookend Merge at TOKEN granularity, so a slot is a whole field, not a chance
 * run of characters.
 *
 * Two record strategies (the bridge is the open research question — try both):
 *   - 'lines':  split the token stream on newlines. Robust for logs; the record
 *               boundary is given, the grammar is used only for diagnosis.
 *   - 'anchor': grammar-driven. Split the start rule at its most frequent
 *               repeated rule — the dominant anchor — so the record boundary
 *               *emerges from repetition* with no delimiter told in advance.
 *
 * Usage:
 *   node general/induce.js <file> [--tokens punct|word|char] [--records lines|anchor]
 *                                 [--max-slots N] [--specific] [--min-group N]
 *   (or pipe text via stdin)
 *
 * Dependency-free; runs in Node. The browser can import the same functions.
 */

const fs = require('fs');
const { tokenize } = require('./tokenize.js');
const { induceGrammar, expandRule, reconstructTokens } = require('./grammar.js');
const { groupByTemplate, reconstruct } = require('../dom-signatures/group-by-template.js');

// Internal token separator for feeding token arrays to groupByTemplate as
// strings. NUL never appears in normal text (and we strip it from input), so
// splitting a joined record by NUL recovers exactly the original tokens.
const NUL = '\u0000';

// ─── Bridge: grammar → records (token arrays) ─────────────────────────────────

/** Split a token array into records at newline-bearing tokens (newline kept). */
function recordsByLines(tokens) {
  const records = [];
  let cur = [];
  for (const tok of tokens) {
    cur.push(tok);
    if (tok.includes('\n')) { records.push(cur); cur = []; }
  }
  if (cur.length) records.push(cur);
  return records.filter((r) => r.length > 0);
}

/**
 * Grammar-driven records: find the most frequently referenced rule at the top
 * level of the start rule and treat each of its occurrences as the start of a
 * record. Returns null if no rule repeats at the top level (caller falls back).
 */
function recordsByAnchor(grammar) {
  const startBody = grammar.rules.get(grammar.start);
  const freq = new Map();
  for (const sym of startBody) {
    if (sym.rule !== undefined) freq.set(sym.rule, (freq.get(sym.rule) || 0) + 1);
  }
  let anchor = null, best = 1;
  for (const [id, c] of freq) if (c > best) { best = c; anchor = id; }
  if (anchor === null) return null;

  const records = [];
  let cur = null;
  for (const sym of startBody) {
    const isAnchor = sym.rule === anchor;
    if (isAnchor) {
      if (cur) records.push(cur);
      cur = [];
    } else if (cur === null) {
      cur = []; // leading material before the first anchor
    }
    // Expand this symbol to terminal tokens and append.
    const toks = sym.rule !== undefined ? expandRule(grammar, sym.rule) : [sym.t];
    cur.push(...toks);
  }
  if (cur && cur.length) records.push(cur);
  return records.filter((r) => r.length > 0);
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Run the full pipeline on a document.
 * @returns {{ tokens, grammar, records, result, recordStrings, strategy }}
 */
function induce(text, options = {}) {
  const {
    tokens: tokMode = 'punct',
    records: recordMode = 'lines',
    maxSlots = 1,
    strategy = 'compress',
    minGroupSize = 2,
  } = options;

  const clean = text.split(NUL).join(''); // guarantee NUL is purely a separator
  const tokens = tokenize(clean, tokMode);
  const grammar = induceGrammar(tokens);

  let records, usedStrategy = recordMode;
  if (recordMode === 'anchor') {
    records = recordsByAnchor(grammar);
    if (!records || records.length < 2) { records = recordsByLines(tokens); usedStrategy = 'lines (anchor fallback)'; }
  } else {
    records = recordsByLines(tokens);
  }

  const recordStrings = records.map((r) => r.join(NUL));
  const result = groupByTemplate(recordStrings, {
    maxSlots, strategy, minGroupSize, delimiter: NUL,
  });

  // Stage 5 — record-level reconstruction fidelity.
  let pass = 0, total = 0;
  for (const g of result.groups) {
    for (const m of g.members) {
      total++;
      if (reconstruct(g.template, m.slots, NUL) === m.original) pass++;
    }
  }

  return {
    tokens, grammar, records, result, recordStrings,
    strategy: usedStrategy, fidelity: { pass, total },
  };
}

// ─── Display ───────────────────────────────────────────────────────────────

const pretty = (s) => s.split(NUL).join('').replace(/\n/g, '\\n');

function report(source, run, opts) {
  const { grammar, records, result, strategy } = run;
  const line = '='.repeat(78);
  console.log(line);
  console.log(`  General Template Induction — ${source}`);
  console.log(line);
  console.log(`\nTokens=${run.tokens.length} · grammar rules=${grammar.rules.size} · ` +
    `records=${records.length} (${strategy}) · tokenizer=${opts.tokens} · maxSlots=${opts.maxSlots}\n`);

  for (let i = 0; i < result.groups.length; i++) {
    const g = result.groups[i];
    console.log(`Template ${i + 1}  (${g.members.length} instances, score ${g.score})`);
    console.log(`  ${pretty(g.template)}`);
    const slotCount = g.members[0].slots.length;
    for (let s = 0; s < slotCount; s++) {
      const vals = g.members.map((m) => pretty(m.slots[s]) || '∅');
      const uniq = [...new Set(vals)];
      const shown = uniq.length <= 8 ? uniq : [...uniq.slice(0, 7), `… +${uniq.length - 7} more`];
      console.log(`    slot ${s}: ${shown.join(', ')}`);
    }
    console.log();
  }

  const { pass, total } = run.fidelity;
  const gT = reconstructTokens(grammar).join('');
  const grouped = records.length - result.ungrouped.length;

  console.log('-'.repeat(78));
  console.log(`Grammar reconstruction: ${gT.length} chars regenerated from start rule`);
  console.log(`Records grouped:        ${grouped}/${records.length} ` +
    `into ${result.groups.length} templates`);
  console.log(`Record reconstruction:  ${pass}/${total} exact`);
  if (result.ungrouped.length) {
    console.log(`\nUngrouped (${result.ungrouped.length}):`);
    for (const s of result.ungrouped.slice(0, 8)) {
      const t = pretty(s);
      console.log(`  ${t.length > 70 ? t.slice(0, 67) + '...' : t}`);
    }
    if (result.ungrouped.length > 8) console.log(`  … +${result.ungrouped.length - 8} more`);
  }
}

function parseArgs(argv) {
  const o = { file: null, tokens: 'punct', records: 'lines', maxSlots: 1, strategy: 'compress', minGroupSize: 2 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tokens') o.tokens = argv[++i];
    else if (a === '--records') o.records = argv[++i];
    else if (a === '--max-slots') o.maxSlots = parseInt(argv[++i], 10) || 1;
    else if (a === '--min-group') o.minGroupSize = parseInt(argv[++i], 10) || 2;
    else if (a === '--specific') o.strategy = 'specific';
    else if (!a.startsWith('--')) o.file = a;
  }
  return o;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  let text;
  try {
    text = opts.file ? fs.readFileSync(opts.file, 'utf8') : fs.readFileSync(0, 'utf8');
  } catch {
    text = '';
  }
  if (!text.trim()) {
    console.error('Usage: node general/induce.js <file> [--tokens punct|word|char] ' +
      '[--records lines|anchor] [--max-slots N] [--specific] [--min-group N]');
    console.error('       (or pipe text via stdin)');
    process.exit(1);
  }
  const run = induce(text, opts);
  report(opts.file || '<stdin>', run, opts);
}

module.exports = { induce };

if (require.main === module) main();
