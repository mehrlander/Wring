# Research Question 6: Implementation

## Question

What is the optimal JS/WASM architecture for practical single-document template induction?

## Key Considerations

**JS landscape gaps** (verify current state)
- `mnemonist`: GeneralizedSuffixArray, no repeat enumeration
- `@jayrbolton/suffix-tree`: Ukkonen's, no frequency-filtered enumeration
- `string-algorithms`: SA+LCP construction, no repeat API
- No library provides `getRepeats(minLen, minFreq)` → need LCP-interval stack traversal

**Architecture questions**
- WASM candidates: SA+LCP construction, suffix automaton, grammar compression
- JS layer: tokenization, typing, candidate filtering, scoring, selection, output
- Memory strategy: TypedArrays, zero-copy views, chunking

**WASM↔JS boundary**
- Memory layout strategy: how do SA/LCP integers in WASM memory map to JS `templates[]` without expensive copying?
- Serialization of tree structures as the friction point

**Data structures**
- Interval lists for occurrences
- Cover bitmaps for overlap detection
- Template DAG if hierarchical model chosen

## Research Findings

### Finding 1: [Title]
**Date**: YYYY-MM-DD
**Source/Method**: [Literature review / Experiment / Analysis]

[Detailed findings]

**Libraries/Tools evaluated**:
-

**Performance characteristics**:
-

**Implications**:
-

---

### Finding 2: [Title]
**Date**: YYYY-MM-DD
**Source/Method**:

[Detailed findings]

**Libraries/Tools evaluated**:
-

**Performance characteristics**:
-

**Implications**:
-

---

## Open Questions

-
-

## Recommendations

[To be determined based on findings]
