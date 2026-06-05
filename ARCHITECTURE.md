# Architecture

This is the canonical description of how Wring works. It supersedes the individual phase READMEs where they conflict.

---

## The Problem

Given one document, discover its recurring structure. No prior knowledge of what varies. Produce a set of templates (literals interleaved with slots) and a map of their occurrences, optimizing for the balance of compression and interpretability (MDL).

## The Pipeline

```
Tokenize  ──>  Sequitur  ──>  Bookend Merge  ──>  Selection  ──>  Extraction
```

Five stages. Each consumes the output of the previous.

---

### 1. Tokenize

Segment the document into a symbol stream. This defines the alphabet Sequitur operates on.

| Granularity | What Sequitur sees | Trade-off |
|---|---|---|
| Characters | Every character | Maximum pattern discovery; rules may cut across meaningful units |
| Punctuation-aware | Split on character-class transitions | Balanced default |
| Domain-aware | HTML tags, code tokens | Best boundaries; requires parser |

Pre-typing (normalizing known field types like dates or IPs before grammar induction) is an optional optimization, not a prerequisite. The mechanism must work without it.

**Status**: One concrete segmenter implemented for the DOM use case — `dom-signatures/extract-signatures.js` turns raw HTML into `tag#id.class.class` signatures. A general-text tokenizer (character / punctuation-aware) is still conceptual.

---

### 2. Sequitur

Run Sequitur on the token stream. Sequitur replaces repeated digrams with grammar rules, building a hierarchy of exact repeats in linear time.

**Input**: Token stream.
**Output**: A grammar — rules whose right-hand sides are sequences of terminals and rule references.

Sequitur finds exact repeats only. If two sequences differ at any position, no rule is formed. This is the gap that Stage 3 addresses.

**Status**: Implemented via **Re-Pair** (`general/grammar.js`), behind a neutral `{ start, rules, ruleUses }` grammar interface. Re-Pair is an offline member of the same grammar-induction family: it greedily replaces the globally most-frequent digram and produces the same hierarchy of exact repeats Stage 3 needs. Online Sequitur can be dropped in behind the same interface later (an initial Sequitur attempt was abandoned for fragile incremental pointer surgery — correctness of Stage 2 matters more than which family member provides it). The suffix tree prototype in `phase-1-discovery/demos/` separately validated O(n) repeat enumeration in the browser.

---

### 3. Bookend Merge

The core insight. Compare Sequitur's grammar rules by aligning their bodies. Rules that share a prefix and suffix but differ in the middle are candidates for merging into a slotted template.

```
R1 → A B C D E
R2 → A B X D E
R3 → A B Y D E

Shared prefix: [A, B]
Shared suffix: [D, E]
Varying middle: {C, X, Y}

Merge → A B $1 D E    where $1 := {C, X, Y}
```

Slots are discovered as positions where rule bodies diverge. No pre-declaration of slot types needed. A slot's identity is the set of values observed at that position. Characterization (numeric, enum, timestamp) is optional post-hoc analysis.

**Open questions** (from `research/FirstReview.md`):

| Question | Consideration |
|---|---|
| Which rules to compare? | All pairs is O(n^2). Need clustering or indexing by prefix/suffix hash. |
| Minimum bookend length? | Too short = coincidental. Too long = misses patterns. |
| Multi-position variance? | Two positions differ — one compound slot or two? |
| Nested variation? | Varying middle is itself a rule reference — collapse alternatives? |
| Ambiguous splits? | Multiple valid prefix/suffix decompositions for the same pair. |

**Status**: Implemented, in two flavors.
- **Bookend Merge** (`dom-signatures/group-by-template.js`) — the literal prefix/suffix version above, with optional LCS multi-slot refinement. Strong when records share a long structural literal (DOM signatures).
- **Structural alignment** (`general/align-group.js`, `--group align`) — buckets records by token count, then clusters by positional agreement; divergent positions become slots. This directly answers the **multi-position variance** question: it recovers one template with a slot per varying field, where Bookend Merge would anchor on an incidental literal (e.g. a client IP) and fracture the template. Demonstrated on `general/fixtures/access.log`. Open: reconciling records whose field *count* differs (different length buckets).

---

### 4. Selection

Rank merged templates by MDL. A template is worth keeping when its compression benefit exceeds its description cost.

```
totalCost = dictionaryCost + dataCost

dictionaryCost = sum over templates of (literalBytes + slotOverhead * slotCount)
dataCost = sum over instances of (templateRef + slotEncoding) + residualCost
```

When candidate templates overlap (compete for the same characters), resolve via weighted interval scheduling: select the non-overlapping subset maximizing total compression gain.

Concepts that remain valid from the phase specs:
- **Character Allocation invariant**: every byte belongs to either a template instance or residual
- **Greedy selection** (Krimp-style): accept templates in order of compression gain, stop when none improve
- **Hierarchy**: templates may nest (a slot value may itself match another template)
- **Residual diagnosis**: high-entropy residual = satiety; low-entropy residual = latent structure worth revisiting

**Status**: Built at two levels. `groupByTemplate` (Stage 3) contains a greedy MDL slice that assigns each *record* to at most one template. The fuller version lives in `selection/mdl-select.js`: an explicit MDL cost model (dictionaryCost + dataCost + residualCost) plus **exact weighted interval scheduling** (O(n log n) DP, verified optimal against brute force) for candidate templates whose instances overlap on the same characters, wrapped in Krimp-style greedy template inclusion. It is standalone today and becomes load-bearing once a candidate generator emits overlapping instances. The Phase 4 spec (`phase-4-selection/README.md`) applies without modification.

---

### 5. Extraction

Map selected templates back to the original document. For each template, produce the list of instances with their slot values as offsets into the source text. Verify reconstruction: concatenating literals and slot values must reproduce the original spans exactly.

**Status**: Reconstruction verification is implemented — `reconstruct(template, slots)` round-trips every grouped member, and the DOM tests assert 100% fidelity. Mapping slot values back to *byte offsets* in the source document (rather than to the signature strings) is not yet built.

---

## What's Validated

| Component | Evidence |
|---|---|
| End-to-end DOM induction (HTML → signatures → templates) | `node dom-signatures/induce-from-html.js dom-signatures/fixtures/sample.html`; tested by `dom-signatures/test-extract.js` |
| End-to-end general-text induction (Tokenize → grammar → templates) | `node general/induce.js general/fixtures/access.log`; lossless at every layer, tested by `general/test-induce.js` |
| Grammar induction (Re-Pair), Stage 2 | `general/grammar.js`; reconstruction + rule-utility invariants in `general/test-grammar.js` |
| Weighted interval scheduling, Stage 4 | `selection/mdl-select.js`; exact, verified vs brute force over 400 random cases |
| Bookend Merge + greedy MDL selection (Stages 3–4) | `dom-signatures/group-by-template.js`; 90–91% grouped, 100% reconstruction on 81 real signatures |
| Suffix tree construction (Ukkonen's, SoA layout) | Working prototype: `phase-1-discovery/demos/custom-suffix-tree-engine.html` |
| Repeat extraction + super-string collapsing | Prototype produces correct results on invoice test data |
| Character Allocation invariant | Enforced and verified in prototype (symbolStream + residual = full document) |
| Browser-viable TypedArray architecture | Prototype runs in-browser with no GC issues on test inputs |

## What's Speculative

| Component | Notes |
|---|---|
| Sequitur on tokenized input | Core algorithm is well-studied, but not yet implemented here |
| Bookend Merge | Key insight of the project, but the algorithm details are open |
| Pairwise consistency / distance matrix | From the earlier Phase 2 spec; may be unnecessary if Bookend Merge works, or may serve as a ranking signal for merge candidates |
| MDL selection and interval scheduling | Specified in detail (Phase 4 spec) but not implemented |

---

## Relationship to Existing Phase Specs

The four phase directories (`phase-1-discovery/` through `phase-4-selection/`) were written before the Sequitur + Bookend Merge pivot. They describe a different algorithmic path: suffix array + LCP enumeration, followed by pairwise gap-variance scoring, followed by center-star alignment, followed by MDL selection.

**What still applies from those specs:**
- Interface contracts (TypedArray layouts, typed output structures)
- Failure mode analysis (token splitting, vocabulary explosion, conflation, shattering, cost modeling errors)
- Browser considerations (memory budgets, streaming computation, sparse representations)
- The Selection phase algorithms (interval scheduling, MDL, hierarchy) are path-independent

**What is superseded:**
- The specific Discovery algorithm (suffix tree traversal → Sequitur)
- The Topology phase concept (statistical gap-variance discrimination → structural Bookend Merge)
- Slot typing as an early concern (now explicitly post-hoc)

---

## The Decoy Problem

Both paths address the same core challenge: distinguishing structural anchors from variable decoys. "Invoice No:" is structure; "USD" is content that happens to repeat.

- **Old path**: Score symbol pairs by gap-variance. Low variance = structural, high variance = noise.
- **New path**: Sequitur only forms rules from exact repeats. Decoys that appear at inconsistent positions never become rules. Bookend Merge then handles near-repeats structurally.

The old path's insight (consistency of distance) may still be useful as a ranking signal within the new path — for example, scoring merge candidates by how consistently their instances are spaced. But it is no longer the primary discrimination mechanism.

---

## Key Invariants

These hold across both paths and are non-negotiable:

1. **Character Allocation**: Every character in the document is accounted for — either within a template instance or in residual. No gaps, no overlaps.
2. **Reconstruction Fidelity**: Concatenating a template's literals with an instance's slot values reproduces the original span exactly.
3. **Slots as Sets**: A slot is defined by its observed values, not a declared type. Typing is optional post-hoc characterization.

---

## Conceptual Foundations

These documents remain current and are not affected by the algorithmic pivot:

- `exploration/Intuition.md` — First-principles observations about template structure
- `exploration/Terms.md` — Vocabulary for matching and emergence
- `exploration/Order.md` — The decoy problem and distance-based discrimination (still valid as a concept; implementation path changed)
