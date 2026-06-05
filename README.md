# Wring

Single-document template induction from internal repetition.

**Status**: Two end-to-end paths run today — a DOM path (HTML → templates) and a
general-text path (Tokenize → grammar → templates). Every stage of the pipeline now
has at least a working implementation. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for
the canonical pipeline description.

## What exists today

| | What | Where |
|---|---|---|
| ✅ **Runnable** | **End-to-end DOM induction** — raw HTML → signatures → slotted templates | [`dom-signatures/induce-from-html.js`](dom-signatures/induce-from-html.js) |
| ✅ **Runnable** | **End-to-end general-text induction** — Tokenize → grammar (Re-Pair) → Bookend Merge | [`general/induce.js`](general/README.md) |
| ✅ **Runnable** | `extractSignatures` — DOM segmenter (Stage 1); `tokenize` — general segmenter (Stage 1) | [`dom-signatures/`](dom-signatures/README.md), [`general/`](general/README.md) |
| ✅ **Runnable** | `induceGrammar` — Stage 2 grammar induction (Re-Pair) | [`general/grammar.js`](general/grammar.js) |
| ✅ **Runnable** | `groupByTemplate` — Bookend Merge (Stage 3) + greedy MDL selection | [`dom-signatures/`](dom-signatures/README.md) |
| ✅ **Runnable** | `selectTemplates` — Stage 4 full MDL + exact weighted interval scheduling | [`selection/`](selection/README.md) |
| ✅ **Runnable** | Interactive browser demo — group signatures, or paste raw HTML (Stage 1 + 3) | [`dom-signatures/demo.html`](dom-signatures/demo.html) |
| 🧪 **Prototype** | Suffix-tree repeat-enumeration engine (validates browser-viability) | [`phase-1-discovery/demos/`](phase-1-discovery/README.md) |
| 📝 **Spec only** | Online Sequitur (Re-Pair stands in for Stage 2 today) | `ARCHITECTURE.md` |
| 📚 **Research** | Distilled LLM research reports + conceptual foundations | [`research/`](research/README.md), `exploration/` |

```bash
# Induce templates from a real HTML document:
node dom-signatures/induce-from-html.js dom-signatures/fixtures/sample.html

# Induce templates from a log / free text:
node general/induce.js general/fixtures/access.log --records lines --max-slots 8
```

Both paths reconstruct losslessly. The honest frontier is **template quality on
multi-field records**: Bookend Merge anchors on the longest shared *literal*, which
on a log line is an incidental field (the client IP) rather than the structural
skeleton — so structural, multi-field grouping (a Stage 3 generalization, and the
[`selection/`](selection/README.md) layer for overlapping candidates) is the next
quality lever. See [`general/README.md`](general/README.md) for the full findings.

## Problem

Given one document, infer a compact set of recurring patterns (templates) and an instance map of their occurrences. 

The goal is to optimize for a balance of compression and human interpretability.

```mermaid
flowchart TD
    Document --> Instances
    Document --> Residual["Residual (Unstructured)"]

    Instances --> Primitives
    
    Primitives --> Literal["Literal (Invariant)"]
    Primitives --> Slot["Slot (Variable)"]
    Primitives --> Whitespace["Whitespace (Layout)"]
```

## Use Cases

Prioritize interpretability over maximal compression:
 * Structured documents (budget bills, legislation): infer markup structure for annotation or XML conversion
 * Web development: convert repetitive HTML into data-driven JS generation
 * Logs: separate boilerplate from variable content to surface the actual information

## Core Objectives

 * **Character Allocation**: Every character—including whitespace—is allocated to one of three primitive types: Literals, Slots, or Whitespace. Un-patterned text is designated as Residual.
 * **Reconstruction Fidelity**: The default model aims for exact reproduction. By treating Whitespace as a distinct primitive, the system can optionally expunge "formatting noise" for readability, acknowledging the trade-off.
 * **Structural Separation**: The system decomposes the document into recurring structural patterns (templates) and their specific occurrences (instances), separating boilerplate from variable content.
 * **Browser-First Performance**: Discovery and indexing logic is optimized for browser memory and execution limits (~100KB–10MB range), utilizing WASM for high-density indexing where necessary.

## Key Assumptions

* **Templates are Grounded in Repeats**: Templates link repeated substrings. We can start from repeated substrings and get to any template. 
* **The "DRY" Objective**: The goal is to "dry up" a document to make the underlying data more intelligible by removing redundant text.
* **Structural vs. Floating Repeats**: Some repeats are "foundational" and tied to document architecture; others are "floating" or transversal. What constitutes structure must be assessed from a perspective. Low variance in relative distance suggests structural; high variance suggests incidental.
* **Idealized Forms**: A template should bind to a meaningful structure. This may involve gravitating toward instances that support a coherent model, and away from instances that pollute it.
* **Flat or Hierarchical**: Instances may cover disjoint regions (flat model, simple interval scheduling) or form a parse DAG where templates contain other templates (hierarchical model, captures nesting but requires defined decoding order). Either may be of interest depending on the document.
* **Navigable Discovery**: Discovery may benefit from a human-in-the-loop process. The algorithm proposes potential structures; the user navigates and selects the abstractions that are most meaningful.

---

## Pipeline

Five stages. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for full detail.

| Stage | Goal | Key Output |
|-------|------|------------|
| Tokenize | Segment document into symbol stream | Token stream (the alphabet for Sequitur) |
| Sequitur | Find exact repeats; build grammar | Rules: sequences of terminals and rule references |
| Bookend Merge | Align near-identical rules; discover slots | Slotted templates (literals + variable positions) |
| Selection | Rank by MDL; resolve overlaps | Non-overlapping template instances + residual |
| Extraction | Map to source text; verify reconstruction | Instance map with slot values as document offsets |

### Working implementation

[`dom-signatures/`](dom-signatures/README.md) runs the DOM use case end-to-end:
[`extract-signatures.js`](dom-signatures/extract-signatures.js) segments raw HTML into
signatures (Stage 1), and [`group-by-template.js`](dom-signatures/group-by-template.js)
merges them into slotted templates (Stage 3) with greedy MDL selection (a slice of
Stage 4). [`induce-from-html.js`](dom-signatures/induce-from-html.js) wires them
together; an [interactive demo](dom-signatures/demo.html) and two test harnesses cover
it. On 81 hand-collected signatures it groups 90–91% with 100% reconstruction fidelity.

### Earlier phase specs

The `phase-*/` directories contain detailed specs (interfaces, algorithms, failure modes) written before the Sequitur + Bookend Merge pivot. Each has a status header indicating what still applies. They remain useful reference material.

| Directory | Status |
|---|---|
| [`phase-1-discovery/`](phase-1-discovery/README.md) | Partially superseded (interfaces and failure modes valid; algorithm replaced by Sequitur) |
| [`phase-2-topology/`](phase-2-topology/README.md) | Superseded (replaced by Bookend Merge) |
| [`phase-3-refinement/`](phase-3-refinement/README.md) | Partially superseded (alignment and consolidation concepts valid; input interface changed) |
| [`phase-4-selection/`](phase-4-selection/README.md) | Current (algorithms are path-independent) |

---

## Exploration

Conceptual foundations and terminology live in `exploration/`:

- **Intuition.md**: First-principles observations about template structure
- **Terms.md**: Vocabulary for matching (seat, bind, register) and emergence (crystallize, induce, distill)
- **Order.md**: Quantifying ordered relationships; distinguishing structural anchors from variable decoys