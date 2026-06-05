# General-Text Pipeline — Tokenize → Grammar → Bookend Merge

The first end-to-end Wring pipeline on **arbitrary text** (not pre-segmented DOM
signatures). Takes a raw document and induces slotted templates for its repeated
records.

```bash
node general/induce.js general/fixtures/access.log --records lines --max-slots 8
# or
cat somefile.txt | node general/induce.js --records anchor
```

## The stages

| Stage | Module | What it does |
|---|---|---|
| 1. Tokenize | [`tokenize.js`](tokenize.js) | Lossless segmentation (`punct` / `word` / `char` / `line`). `tokens.join('') === text`. |
| 2. Grammar | [`grammar.js`](grammar.js) | **Re-Pair** grammar induction — a hierarchy of *exact* repeats. (See note below.) |
| Bridge | [`induce.js`](induce.js) | Turns the grammar into "records" (near-repeated spans) and feeds them to Stage 3 at token granularity. |
| 3–4. Merge + Select | [`../dom-signatures/group-by-template.js`](../dom-signatures/group-by-template.js) | Bookend Merge + greedy MDL selection. |
| 5. Reconstruct | `induce.js` | Verifies every grouped record round-trips exactly. |

### Why Re-Pair instead of Sequitur?

`ARCHITECTURE.md` names **Sequitur** for Stage 2. We implement **Re-Pair**
(Larsson & Moffat) instead, behind a neutral `{ start, rules, ruleUses }`
interface. Both produce a hierarchical grammar of exact repeats — the only thing
Stage 3 needs. Re-Pair is offline and greedily replaces the globally most-frequent
digram, which is far simpler to implement *correctly* and tends to surface the
dominant repeated structure first. An online Sequitur can be dropped in later
behind the same interface. (An initial Sequitur attempt was abandoned because its
incremental pointer surgery was error-prone; correctness of Stage 2 matters more
than which algorithm in the family provides it.)

### The bridge is the open question

Stage 3 compares whole records. Getting from a grammar to "records" is the part
ARCHITECTURE leaves open, so `induce.js` offers two strategies to compare:

- **`lines`** — split the token stream on newlines. The record boundary is given;
  the grammar is used only for diagnosis. Robust for logs.
- **`anchor`** — split the start rule at its most frequently referenced rule (the
  dominant repeat), so the record boundary *emerges from repetition* with no
  delimiter told in advance. Falls back to `lines` if nothing repeats at top level.

## What this experiment taught us (honest findings)

Run on an 8-line Apache-style access log:

1. **The pipeline works and is lossless.** Tokenizers round-trip, the grammar
   regenerates the exact stream, and every grouped record reconstructs exactly
   (verified in `test-induce.js`). The plumbing is sound.

2. **Field extraction with multi-slot is surprisingly decent.** With
   `--max-slots 8`, the LCS multi-slot refinement separates timestamp, status
   (`200/404/500`), and byte-count fields into distinct slots.

3. **Grouping quality is the ceiling, and it's a Stage-3 limitation.** Bookend
   Merge anchors on the *longest shared literal* prefix/suffix. For log lines that
   is the client IP (`192.168.1.10`) — an incidental field, not the structural
   skeleton. So lines that share an IP get grouped together regardless of method,
   and one logical template (the combined-log-format line) fractures into several.
   With a single slot (`--max-slots 1`) the entire varying middle collapses into
   one useless slot.

4. **`anchor` segmentation mis-aligns when the dominant repeat doesn't coincide
   with the record boundary** — records then span across newlines. Discovering the
   record unit purely from the grammar remains genuinely unsolved here.

**Takeaway:** the missing capability is *structural* grouping — aligning records by
their shared skeleton (multi-field, order-aware) rather than by the single longest
literal bookend. That is a Stage-3 generalization (multi-position variance, the
open question in `ARCHITECTURE.md`), and it is the highest-value next step for
quality on free text.

## Files

| File | Description |
|---|---|
| [`tokenize.js`](tokenize.js) | Lossless tokenizers (Stage 1) |
| [`grammar.js`](grammar.js) | Re-Pair grammar induction (Stage 2) + `expandRule`, `reconstructTokens` |
| [`induce.js`](induce.js) | Bridge + end-to-end CLI + `induce(text, options)` |
| [`fixtures/access.log`](fixtures/access.log) | Apache-style log sample with multi-field variation |
| [`test-grammar.js`](test-grammar.js) | Grammar invariants: reconstruction, no-repeats-remain, rule utility |
| [`test-induce.js`](test-induce.js) | Tokenizer losslessness + end-to-end reconstruction fidelity |

```bash
node general/test-grammar.js
node general/test-induce.js
```
