# Wring

Single-document template induction from internal repetition.

**Status**: Research phase. One of the five pipeline stages — Bookend Merge — has a working
implementation; the rest is design specs and research. See [`ARCHITECTURE.md`](ARCHITECTURE.md)
for the canonical pipeline description.

## What exists today

| | What | Where |
|---|---|---|
| ✅ **Runnable** | `groupByTemplate` — Stage 3 (Bookend Merge), groups strings into slotted templates | [`dom-signatures/`](dom-signatures/README.md) |
| ✅ **Runnable** | Interactive browser demo, 81 real DOM signatures pre-loaded | [`dom-signatures/demo.html`](dom-signatures/demo.html) |
| 🧪 **Prototype** | Suffix-tree repeat-enumeration engine (validates browser-viability, not the Sequitur path) | [`phase-1-discovery/demos/`](phase-1-discovery/README.md) |
| 📝 **Spec only** | Tokenize, Sequitur, Selection, Extraction stages | `ARCHITECTURE.md`, `phase-*/` |
| 📚 **Research** | Distilled LLM research reports + conceptual foundations | [`research/`](research/README.md), `exploration/` |

```bash
# Try the one working piece in ~5 seconds:
node dom-signatures/test-signatures.js
```

There is no end-to-end document → templates pipeline yet. `groupByTemplate` is the only
production-ready code; it operates on pre-segmented strings (Stage 3), with tokenization
and grammar induction (Stages 1–2) stubbed by splitting on `.`.

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

[`dom-signatures/`](dom-signatures/README.md) contains the first working implementation of Stage 3 (Bookend Merge), applied to DOM signature strings from a real web UI. Includes an [interactive demo](dom-signatures/demo.html) and a test harness covering 81 signatures. Groups 90-91% of inputs with 100% reconstruction fidelity.

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