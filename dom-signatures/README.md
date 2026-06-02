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

## Files

| File | Description |
|------|-------------|
| [`group-by-template.js`](group-by-template.js) | Core algorithm — `groupByTemplate`, `summarize`, `reconstruct` |
| [`test-signatures.js`](test-signatures.js) | Node.js test harness with 81 real DOM signatures |
| [`demo.html`](demo.html) | Interactive browser demo (DaisyUI + Alpine.js) |

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

### CLI test

```bash
node dom-signatures/test-signatures.js
```

## Relation to Wring Pipeline

This implements Stage 3 (Bookend Merge) from [`ARCHITECTURE.md`](../ARCHITECTURE.md). The full Wring pipeline is:

1. **Tokenize** — segment document into symbol stream
2. **Sequitur** — grammar induction to find exact repeats
3. **Bookend Merge** — align near-identical rules into slotted templates *(this module)*
4. **Selection** — rank by MDL, resolve overlapping candidates
5. **Extraction** — map templates back to source text

Here, the "tokenization" is trivial (split on `.`) and the input strings serve as pre-segmented rules, so the algorithm operates directly at Stage 3.
