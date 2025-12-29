# Wring

Single-document template induction from internal repetition.

**Status**: Research phase

## Problem

Given one document, infer a compact set of recurring patterns (templates) and an instance map of their occurrences. The goal is to optimize for a balance of compression and human interpretability, ensuring that the decomposed structure can reconstruct the original document exactly.

```mermaid
flowchart TD
    Document --> Instances
    Document --> Residual["Residual (Unstructured)"]

    Instances --> Primitives
    
    Primitives --> Literal["Literal (Invariant)"]
    Primitives --> Slot["Slot (Variable)"]
    Primitives --> Whitespace["Whitespace (Layout)"]

## Use Cases
Prioritize interpretability over maximal compression:
 * Structured documents (budget bills, legislation): infer markup structure for annotation or XML conversion
 * Web development: convert repetitive HTML into data-driven JS generation
 * Logs: separate boilerplate from variable content to surface the actual information

## Core Objectives
 * Character Allocation: In principle, every character in a document—including whitespace—is respected and allocated to one of three Primitive Types: Literals, Slots, or Whitespace. Any un-patterned text is designated as Residual.
 * Reconstruction Fidelity: The default model aims for exact reproduction. However, by treating Whitespace as a distinct primitive, the system can provide mechanisms to expunge "formatting noise" from the output for better readability, acknowledging the trade-off in reproducibility.
 * Structural Separation: The system decomposes the document into recurring structural patterns (templates) and their specific occurrences (instances), allowing for a clean division between boilerplate and variable content.
 * Browser-First Performance: Discovery and indexing logic is optimized for the memory and execution limits of the browser environment (~100KB–10MB range), utilizing WASM for high-density indexing where necessary.

## Key Assumptions (Open)

These are working assumptions to be validated or revised:

- Sufficient internal redundancy exists (no external corpus needed)
- Exact structure mining has mature primitives (SA+LCP, suffix tree/automaton, grammar compression); practical risks are output sensitivity (pattern explosion) and JS memory/perf limits
- Template induction is design-dependent: token granularity, slot boundary inference, overlap policy, and objective function materially affect results.

## Architectural Forks

Two major design decisions shape the entire approach. These remain open:

### Pipeline Architecture

| Path | Description | Trade-offs |
|------|-------------|------------|
| **Repeat→Stitch** | Mine repeated spans, then stitch co-occurring anchors into templates | Interpretable intermediate steps; may miss hierarchical structure |
| **Grammar-First** | Use grammar compression (Sequitur/Re-Pair) with constrained rule formation; rules may directly correspond to templates | Captures hierarchy naturally; rules may not align with human-interpretable units |

### Coverage Model

| Model | Description | Trade-offs |
|-------|-------------|------------|
| **Flat** | Instances cover disjoint regions; residual fills gaps; reconstruction is concatenation in offset order | Simple selection (weighted interval scheduling); no compositionality |
| **Hierarchical** | Instances form a parse DAG; templates can contain other templates | Captures nested structure; requires defined decoding order; more complex selection |

---

## Research Questions

### 1. Tokenization

*What representation best supports template discovery?*

**Token granularity**
- Character-level vs token stream (word/punct/whitespace)
- Trade-offs: pattern frequency vs structural fidelity
- Open question: should token boundaries be *discovered* from repeated structure rather than imposed? Character-level mining may reveal patterns that pre-tokenization would miss.

**Implications**
- Mining on "skeleton tokens" (literals) vs "value tokens" (variable content) is resolved by the strict fidelity constraint: we mine literals, everything else is a slot.

### 2. Repeat Primitives + Candidate Control

*Which primitives yield high-signal candidates while avoiding pattern explosion?*

**Terminology**
- *Occurrence list*: sorted positions of a candidate anchor in the document
- *Interval*: SA-range (pair of suffix array indices) representing those positions

**Enumeration approaches**
- SA+LCP interval traversal: scan LCP array with stack of open intervals; each close emits (pattern, length, frequency, occurrence list)
- Suffix tree internal node traversal
- Suffix automaton
- Winnowing/fingerprinting as coarse seeding for large documents

**Repeat types**
- Maximal repeats: can't extend without losing occurrences
- Supermaximal repeats: maximal and not contained in any longer repeat with same frequency
- Closed repeats: no strict superpattern with the same occurrence set

Open question: which repeat type produces cleaner literal skeletons across different document types (logs vs legal text vs source code)?

**Candidate control**
- Frequency and length thresholds
- Dominance/containment pruning: when does a longer pattern subsume a shorter?
- Output-sensitive complexity depends on document structure

### 3. Template Formation

*How to convert repeated spans into parameterized templates?*

**Core question**: When should two co-occurring repeated spans become one template vs remain separate? This is analogous to `Diff_EditCost`—a granularity knob.

**Anchor-sequence search**
- Given repeated spans, find ordered chains (A – gap – B – gap – C) that recur across occurrences
- Technique: emit event stream of (pos, anchorID), then sliding-window join or segment-bucketed joins
- Directly yields template skeletons with gaps as candidate slots
- Require at least one O(#candidates) alignment strategy, not O(#candidates²)

**Offset histograms**
- For candidate pairs (A, B), compute distribution of `pos(B) − pos(A)` across occurrences
- Peaks indicate consistent relative positioning
- Gate by frequency/length to avoid quadratic blowup

**Multi-occurrence alignment**
- Align all instances of a candidate template region to infer literal vs slot positions
- Baseline: center-star (pick highest-scoring instance as center, align all others pairwise, merge)

**Gap analysis**
- Gap entropy as stitching heuristic: high-entropy gaps become slots; low-entropy gaps suggest merging adjacent literals
- Minimum literal length, maximum slot count, compression gain threshold

**Slot boundaries**
- Primary mode: align with token boundaries
- Optional refinement: split tokens when it materially improves MDL without harming interpretability

### 4. Objective + Selection

*What scoring and selection regime works in practice?*

**MDL-style objective**
Open question: optimal template selection relates to smallest grammar (NP-hard). What approximation strategies from grammar compression literature apply?

**Cost modeling**
- Explicit costs prevent degenerates: mostly-slot templates, tiny frequent literals, single-use templates
- Slot encoding cost depends on content: pure whitespace < bounded integer < unconstrained string

**Calibration** (not static weights)
- How should costs adjust based on document size, average token length, observed entropy?
- Proxy scores: `coverage × literal_length − slot_entropy_penalty` as cheaper approximation

**Selection algorithms**
- Weighted interval scheduling: candidate instances as intervals with weight = gain; classic DP for flat model
- Krimp-style greedy: order by length × frequency, accept if total code length decreases

**Termination criteria**
- Coverage threshold
- Diminishing returns
- Template count limit

**Partial matches**
- Policy needed when most but not all instances fit a pattern
- Options: exclude outliers to residual, create variant templates
- **Constraint**: No fuzzy matching. Exact matches only.

**Residual classification**
- Residual regions may be noise (truly random) or outliers (near-matches that failed threshold)
- Outlier promotion policy: if a residual is 90% similar to existing template, force-fit as dirty instance (recording all diffs as slots) or keep separate?

### 5. Adjacent Domains

*Which existing solutions apply?*

| Domain | Relevance | Adaptation needed |
|--------|-----------|-------------------|
| **Log parsing** (Drain, Spell, LogMine) | Clustering + consensus | Assumes pre-segmented lines; continuous text? |
| **Clone detection** | Abstract tokenization | Pre-typing (removed per strict fidelity) |
| **Grammar compression** (Sequitur, Re-Pair) | Hierarchical structure discovery | May be the right primitive, not just related work |
| **Web wrapper induction** (IEPAD) | Repeat detection + alignment for records | Directly analogous pipeline |
| **Diff algorithms** | Cleanup heuristics for small differences | Analogous to slot boundary decisions |

### 6. Implementation

*JS/WASM architecture for practical use*

**JS landscape gaps** (verify current state)
- `mnemonist`: GeneralizedSuffixArray, no repeat enumeration
- `@jayrbolton/suffix-tree`: Ukkonen's, no frequency-filtered enumeration
- `string-algorithms`: SA+LCP construction, no repeat API
- No library provides `getRepeats(minLen, minFreq)` → implement LCP-interval stack traversal

**Architecture questions**
- WASM candidates: SA+LCP construction, suffix automaton, grammar compression
- JS layer: tokenization, candidate filtering, scoring, selection, output
- Memory strategy: TypedArrays, zero-copy views, chunking

**WASM↔JS boundary**
- Memory layout strategy needed: how do SA/LCP integers in WASM memory map to JS `templates[]` without expensive copying?
- Serialization of tree structures is the friction point

**Data structures**
- Interval lists for occurrences
- Cover bitmaps for overlap detection
- Template DAG if hierarchical model chosen

---

## Candidate Pipeline

One possible architecture (to be validated against grammar-first alternative):

1. (optional) segment on structural markers (blank lines, headers)
1. tokenize → token IDs + positions
1. build index (SA+LCP or grammar)
1. extract repeated structure → candidates + occurrence lists
1. form templates:
   - anchor-sequence search
   - align occurrences
   - apply gap-entropy heuristic
1. score with MDL-like objective
1. select under overlap policy
1. emit templates[] + instances[] + residual

---

## Failure Modes

- **Token Splitting**: Pattern boundaries landing inside semantic atoms (words, numbers).
- **Shattering**: Cohesive logical units fracturing into disconnected micro-templates.
- **Conflation**: Distinct structures collapsing into a single generic template via shared syntax.
- **Scale Bias**: Capturing the broad container while missing the discrete items within (or vice versa).
- **Cost Modeling**: Miscalculating the utility of merging variants versus keeping them distinct.