# DOM Signature Grouping — Bookend Merge

First working implementation of Wring's **Stage 3 (Bookend Merge)** algorithm, applied to DOM signature strings.

**[Live Demo](../dom-signatures/demo.html)** — interactive browser tool for exploring the algorithm

## What is a DOM Signature?

A dot-separated string encoding an element's tag and CSS classes:

```
div.flex.items-center.gap-2.transition.border-t-0.5.border-transparent
h3#_r_14a_.text-[12px].break-words.text-text-100.line-clamp-4
```

These signatures are extracted from real web UIs. Many share a common structure with small variations — exactly the kind of internal repetition Wring is designed to discover.

## How It Works

The `groupByTemplate` function discovers shared templates with interpolation slots:

```
Input:
  h3#_r_14a_.text-[12px].break-words.text-text-100.line-clamp-4
  h3#_r_14k_.text-[12px].break-words.text-text-100.line-clamp-4
  h3#_r_d1_.text-[12px].break-words.text-text-100.line-clamp-4
  ...

Output:
  Template: h3#_r_${0}.text-[12px].break-words.text-text-100.line-clamp-4
  Slot values: "14a_", "14k_", "d1_", ...
```

### Algorithm (6 phases)

| Phase | What happens |
|-------|-------------|
| **1. Pairwise Bookend Merge** | Compare all pairs of token sequences; find shared prefix + suffix, treat the divergent middle as a slot |
| **2. Broadcast matching** | Test each candidate template against all inputs, not just the originating pair |
| **3. MDL scoring** | Rank by compression gain: `(groupSize - 1) * literalChars` |
| **4. Greedy assignment** | Select highest-scoring templates first; no string assigned to multiple groups |
| **5. Character-level refinement** | Tighten slot boundaries by absorbing common character prefixes/suffixes into the template |
| **6. Multi-slot refinement (LCS)** | Optionally split a single slot into multiple slots by discovering internal anchors via Longest Common Subsequence |

### Key Properties

- **Lossless**: `reconstruct(template, slots)` exactly reproduces the original string for every grouped member
- **MDL-optimal**: greedy selection maximizes total compression gain
- **Two strategies**: `compress` (broad groups, maximum compression) vs `specific` (fine-grained sub-groups)
- **Configurable**: slot count, group size threshold, delimiter, and refinement toggles

## Results on Test Data

81 real DOM signatures from a production web UI (reproduce with `node test-signatures.js`):

| Mode | Grouped | Ungrouped | Groups |
|------|---------|-----------|--------|
| Single-slot (`maxSlots=1`) | 73/81 (90%) | 8 | 7 |
| Multi-slot (`maxSlots=2`) | 73/81 (90%) | 8 | 7 |
| Specific strategy (`maxSlots=1`) | 74/81 (91%) | 7 | 19 |

`maxSlots=2` does not increase coverage on this data — it refines *structure* within a
group (the two `button` signatures gain a second slot) rather than capturing more strings.
The `specific` strategy trades broad groups for finer-grained templates: more groups, and
one extra string captured.

Reconstruction fidelity: **100%** — all 146 grouped members across the modes reconstruct
to their original string exactly (`reconstruct(template, slots) === original`).

## End-to-end: raw HTML → templates

`group-by-template.js` operates on pre-segmented signature strings. The
[`extract-signatures.js`](extract-signatures.js) **segmenter** closes the loop by
turning a raw HTML document into those signatures — so you can hand the pipeline a
real page instead of a hand-collected list. This is the DOM use case running
end-to-end (Stage 1 → Stages 3–5) for the first time.

```bash
# Induce templates from an HTML file…
node dom-signatures/induce-from-html.js dom-signatures/fixtures/sample.html

# …or from any page on stdin:
curl -s https://example.com | node dom-signatures/induce-from-html.js
```

```js
import { extractSignatures } from './extract-signatures.js';
import { groupByTemplate, summarize } from './group-by-template.js';

const signatures = extractSignatures(htmlString);   // Stage 1 (DOM segmenter)
const result = groupByTemplate(signatures);          // Stages 3–4
console.log(summarize(result));                       // induced templates + slots
```

The segmenter emits `tag#id.class.class` signatures in document order. It is
dependency-free: in Node it scans start tags with a regex (robust enough for real
markup, no tree build); in the browser, `extractSignaturesFromNodes(root)` walks a
live DOM / `DOMParser` result for exact parsing. `<script>`, `<style>`, and `<head>`
content are skipped, and (by default) elements with neither a class nor an id are
dropped. `--dedupe` collapses identical signatures; `countSignatures` tallies the
most-repeated structures.

The DOM segmenter is *one* concrete Stage-1 implementation. Any function producing
`string[]` can feed Stage 3 — a future general-text front-end (Tokenize → Sequitur)
would be a different segmenter feeding the same merge.

## Files

| File | Description |
|------|-------------|
| [`group-by-template.js`](group-by-template.js) | Core algorithm — `groupByTemplate`, `summarize`, `reconstruct` |
| [`extract-signatures.js`](extract-signatures.js) | DOM segmenter (Stage 1) — `extractSignatures`, `extractSignaturesFromNodes`, `countSignatures` |
| [`induce-from-html.js`](induce-from-html.js) | End-to-end CLI — HTML file or stdin → induced templates + compression summary |
| [`fixtures/sample.html`](fixtures/sample.html) | Hand-written HTML fixture with genuine component repetition |
| [`test-signatures.js`](test-signatures.js) | Node.js test harness with 81 real DOM signatures |
| [`test-extract.js`](test-extract.js) | Tests for the segmenter and the end-to-end HTML → templates path |
| [`demo.html`](demo.html) | Interactive browser demo (DaisyUI + Alpine.js). Toggle **Signatures / HTML** to paste raw HTML and run Stage 1 extraction + Stage 3 grouping live. |

## Usage

### Browser (ES module)

```js
import { groupByTemplate, summarize, reconstruct } from './group-by-template.js';

const result = groupByTemplate(strings, {
  maxSlots: 1,        // max interpolation slots per template
  minGroupSize: 2,    // minimum members per group
  strategy: 'compress', // 'compress' or 'specific'
  refineSlots: true,  // character-level boundary refinement
  delimiter: '.',     // token delimiter
});

console.log(summarize(result));
```

### Node.js

```js
const { groupByTemplate, summarize, reconstruct } = require('./group-by-template.js');

const result = groupByTemplate(strings);
for (const g of result.groups) {
  for (const m of g.members) {
    console.assert(reconstruct(g.template, m.slots) === m.original);
  }
}
```

### CLI tests

```bash
node dom-signatures/test-signatures.js   # Stage 3 on 81 real signatures
node dom-signatures/test-extract.js      # DOM segmenter + end-to-end HTML path
```

## Relation to Wring Pipeline

This directory implements multiple stages from [`ARCHITECTURE.md`](../ARCHITECTURE.md) for the DOM use case. The full Wring pipeline is:

1. **Tokenize** — segment document into symbol stream — *`extract-signatures.js` (DOM segmenter)*
2. **Sequitur** — grammar induction to find exact repeats — *not yet built; the DOM path skips it*
3. **Bookend Merge** — align near-identical rules into slotted templates — *`group-by-template.js`*
4. **Selection** — rank by MDL, resolve overlapping candidates — *greedy MDL slice inside `group-by-template.js`*
5. **Extraction** — map templates back to source text; verify reconstruction — *`reconstruct` + fidelity checks*

For DOM signatures, exact grammar induction (Stage 2) is unnecessary: an element's
signature is already an atomic unit, so the segmenter feeds Bookend Merge directly.
A general-text pipeline would insert Tokenize → Sequitur ahead of Stage 3.
