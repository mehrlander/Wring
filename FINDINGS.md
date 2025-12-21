# Wring: Consolidated Research Findings

## Executive Synthesis

Wring addresses a fundamental problem in text processing: extracting reusable structural templates from unstructured text to enable both compression and structured data extraction. This document consolidates findings from five research areas into a unified technical specification for implementation.

**The Core Insight**: Template discovery is equivalent to finding the smallest grammar that explains the document—an information-theoretic problem with a well-defined objective (Minimum Description Length) and mature algorithmic solutions from adjacent domains. The key innovation is combining techniques from log parsing, clone detection, grammar compression, web wrapper induction, and bioinformatics into a coherent pipeline that handles natural language text.

**The Central Trade-off**: Every design decision balances **pattern frequency** (how often patterns appear) against **structural fidelity** (how well patterns align with meaningful units). MDL provides the objective function that naturally resolves this trade-off: templates are worth extracting when their compression benefit exceeds their description cost.

---

## Unified Architecture: Five-Phase Pipeline

The research converges on a five-phase architecture where each phase solves a specific problem:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ABSTRACTION   │───▶│   SEGMENTATION  │───▶│     MINING      │───▶│   REFINEMENT    │───▶│   EXTRACTION    │
│                 │    │                 │    │                 │    │                 │    │                 │
│ Tokenization +  │    │ Entropy-based   │    │ Repeat finding  │    │ Multi-sequence  │    │ Template        │
│ Type normalization│  │ boundary detect │    │ + grammar rules │    │ alignment       │    │ matching + diff │
│                 │    │                 │    │                 │    │                 │    │                 │
│ Q1 techniques   │    │ Q5 techniques   │    │ Q2 + Q5         │    │ Q3 techniques   │    │ Q4 + Q5         │
│                 │    │                 │    │ techniques      │    │                 │    │ techniques      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
       │                      │                      │                      │                      │
       ▼                      ▼                      ▼                      ▼                      ▼
   Raw text →          Abstract tokens →       Pseudo-records →      Candidate          Refined templates
   Abstract tokens     Discrete records        Repeat occurrences    templates →        + slot values
                                                                     Refined templates
```

### Phase 1: Abstraction (Q1 Tokenization + Typing)

**Problem**: Raw text has too much variability—timestamps, IDs, and names create near-zero exact repeats.

**Solution**: Punctuation-aware tokenization with selective pre-typing:
- Split on character-class boundaries (letter→digit, symbol→letter)
- Normalize high-entropy tokens: `2024-01-15 14:30:22` → `<TIMESTAMP>`, `user_12847` → `user_<NUM>`
- Preserve structural markers (punctuation, delimiters) as distinct tokens

**Algorithm**: Regex-based token classification with NER fallback
```
Token stream: ["User", "_", "<NUM>", "logged", "in", "at", "<TIMESTAMP>", "from", "<IP>"]
```

**Output**: Integer-encoded abstract token stream (vocabulary reduced from 50K+ words to <500 token types)

### Phase 2: Segmentation (Q5 Adjacent Domains - Information Theory)

**Problem**: Continuous text lacks natural boundaries; log parsing algorithms assume line-delimited records.

**Solution**: Entropy-based boundary detection:
- Calculate conditional entropy H(token_i | token_{i-1}) in sliding window
- Local maxima indicate structural boundaries (uncertainty spikes = pattern transitions)
- Creates pseudo-records from continuous stream

**Algorithm**: Sliding window entropy calculation, O(n) linear scan
```
Entropy: ─────╲╱─────╲╱─────╲╱─────
                ↑       ↑       ↑
             boundary boundary boundary
```

**Output**: Discrete candidate records (segments) with boundary positions

### Phase 3: Mining (Q2 Repeat Primitives + Q5 Grammar Compression)

**Problem**: Find all recurring patterns without O(n²) explosion.

**Solution**: Closed repeats via suffix array + LCP, optionally combined with grammar induction:

**Primary Algorithm - Suffix Array Mining**:
1. Build suffix array from abstract token stream (SA-IS algorithm, O(n))
2. Compute LCP array for repeat structure (O(n))
3. Enumerate closed repeats via interval stack traversal (O(n log n) output)
4. Filter: length ≥ 3 tokens, frequency ≥ 3 occurrences, entropy > 1.5 bits

**Alternative Algorithm - Grammar Induction**:
1. Run Sequitur on token stream (online, O(n), streaming-friendly)
2. Extract grammar rules as candidate templates
3. Prune single-use rules (utility < 2)

**When to Use Which**:
| Scenario | Algorithm | Rationale |
|----------|-----------|-----------|
| Batch processing, <10MB | SA + LCP | Maximum precision, all patterns |
| Streaming/real-time | Sequitur | Online, incremental updates |
| Highly repetitive (>50% redundancy) | r-enum on RLBWT | Compressed-domain mining |
| Very large (>100MB) | Winnowing → SA on shards | Pre-filter then exact analysis |

**Output**: Candidate patterns with occurrence lists `[(pattern, [(start, end), ...]), ...]`

### Phase 4: Refinement (Q3 Template Formation)

**Problem**: Raw repeats don't distinguish literals from slots; need to determine which positions vary.

**Solution**: Center-star multiple sequence alignment + gap entropy analysis:

1. **Cluster occurrences** by pattern similarity (edit distance)
2. **Select center**: Pick median-length instance from each cluster
3. **Pairwise align**: Align all cluster members to center via Myers' diff
4. **Column analysis**:
   - Identical columns → template literals
   - Variable columns → template slots
5. **Gap entropy validation**:
   - H(gap) < 1.5 → merge (missed literal)
   - H(gap) > 3.0 → slot (true variable)

**Merge Decision Cascade**:
```
IF min_literal_length >= 3 tokens
   AND slot_count <= 4
   AND occurrences >= 3
   AND compression_gain > threshold
   AND gap_entropy confirms slot/literal classification
THEN merge into template
ELSE reject or keep separate
```

**Output**: Refined templates with explicit literal/slot structure

### Phase 5: Extraction (Q4 Selection + Q5 Diff)

**Problem**: Select which templates to keep; apply templates to new text.

**Solution**: MDL-based selection + diff-based slot extraction:

**Selection (Weighted Interval Scheduling)**:
1. Score each template by MDL gain: `gain = savings - (template_cost + slot_cost)`
2. Model instances as weighted intervals
3. DP to find optimal non-overlapping coverage
4. Terminate when marginal gain < ε

**Extraction (Template Matching)**:
1. Lookup best-match template (hash or parse tree index)
2. Run token-level Myers' diff against template
3. Extract slot values from diff regions
4. Apply semantic cleanup (align to token boundaries)

**Output**: Structured data `{template_id, slots: {name: value, ...}}`

---

## Critical Path: What Must Be Built First

Implementation must follow dependency order:

```
Week 1-2: Foundation Layer
├── Punctuation-aware tokenizer (Q1)
├── Type detection regexes (dates, IPs, numbers, UUIDs)
├── Token-to-integer encoder (vocabulary management)
└── Basic entropy calculator

Week 3-4: Core Mining
├── Suffix array construction (WASM - SA-IS algorithm)
├── LCP array computation
├── Closed repeat enumeration (interval stack)
└── Basic frequency/length filtering

Week 5-6: Template Formation
├── Myers' diff implementation (or use diff-match-patch)
├── Center-star alignment
├── Gap entropy calculation
└── Merge decision logic

Week 7-8: Selection & Optimization
├── MDL cost functions (Elias codes, type-aware encoding)
├── Weighted interval scheduling DP
├── Template library management
└── Extraction API

Week 9+: Enhancement
├── Sequitur for streaming
├── Segmentation for continuous text
├── Domain-specific tuning
└── Performance optimization
```

**Critical Dependency**: Nothing works without the tokenizer (Phase 1) producing integer-encoded abstract tokens. Build this first and validate thoroughly.

---

## Top 15 Critical Insights

### Algorithmic Foundations

1. **Closed repeats solve the redundancy problem**: Unlike maximal repeats (O(n²) candidates), closed repeats are bounded at O(n log n) while preserving hierarchical structure. They eliminate fragment redundancy by requiring each occurrence set to be unique.

2. **SA + LCP is the practical workhorse**: 4-8 bytes per character (vs. 20-40 for suffix trees), O(n) construction, excellent cache locality. Interval stack traversal provides virtual suffix tree capabilities without the memory overhead.

3. **Pre-typing transforms the discovery problem**: Without normalizing timestamps/IDs, almost no lines match exactly. With normalization, thousands of lines reduce to a handful of templates—a vocabulary collapse that makes patterns discoverable.

4. **MDL is the objective function, not a heuristic**: The Minimum Description Length principle provides an information-theoretic foundation: optimal templates minimize `L(model) + L(data|model)`. This replaces arbitrary similarity thresholds with principled compression-based decisions.

5. **Grammar compression may be the primitive**: Sequitur's online digram replacement directly produces the smallest grammar (= best templates) in O(n) time. For many use cases, running Sequitur on abstract tokens may be simpler than the full SA pipeline.

### Design Decisions

6. **Tokenization is the granularity knob**: Character-level finds everything but creates noise; word-level is clean but brittle. Punctuation-aware tokens (split on character class boundaries) balance interpretability with pattern discovery.

7. **Type-aware slot costs enable self-tuning**: Elias gamma for small integers (cheap), length-prefix for strings (expensive), dictionary encoding for enums (auto-detected). Accurate costs make the system distinguish error codes (worth extracting) from random IDs (noise).

8. **Center-star alignment beats full MSA**: Multiple sequence alignment is NP-hard; center-star provides 2-approximation in O(k·L²). Sufficient for logs where a clear prototype exists.

9. **Offset histogram topology is diagnostic**: Gap distance distributions reveal structure:
   - Narrow peak → fixed delimiter (merge)
   - Multiple modes → enum slot
   - Gaussian spread → variable slot
   - Uniform → no relationship

10. **Residuals are anomalies by construction**: Lines that don't compress (ratio ≈ 1.0) are high-entropy—surprising to the model, likely novel or erroneous. Compression score = unified anomaly metric.

### Architecture

11. **Abstract tokenization is the bridge to exact algorithms**: Clone detection's key insight: replacing variables with placeholders converts fuzzy Type-2 patterns into exact repeats in abstract space. This enables lossless grammar compression algorithms to find parametric templates.

12. **Segmentation enables continuous text processing**: Log parsing assumes line-delimited records. Entropy-based boundary detection (H(token|prev) spikes) creates pseudo-records from continuous streams, enabling reuse of mature algorithms.

13. **All domains converge on suffix structures**: Log parsing (tries), wrapper induction (PAT trees), clone detection (suffix arrays), bioinformatics (suffix trees)—independent development of the same fundamental data structure for O(n) repeat finding.

14. **WASM for compute, JS for orchestration**: Suffix array construction is the only truly performance-critical component. Everything else (tokenization, entropy, alignment, selection) is tractable in pure JavaScript for reasonable input sizes.

15. **Each adjacent domain solves one weakness**: Log parsing (clustering), clone detection (abstraction), grammar compression (mining), wrapper induction (alignment), diff algorithms (extraction)—synthesizing these creates a complete solution none provides alone.

---

## Implementation Roadmap: JS/WASM Architecture

### Component Allocation

| Component | Implementation | Rationale |
|-----------|---------------|-----------|
| **Tokenizer** | Pure JS | Simple regex/string ops; not bottleneck |
| **Type detector** | Pure JS | NER via compromise.js or regex; <1ms per token |
| **Token encoder** | Pure JS | Map operations; vocabulary management |
| **Entropy calculator** | Pure JS | Frequency counting + log2; trivial |
| **Suffix array (SA-IS)** | WASM (C++) | O(n) but tight loops; 10-50x speedup |
| **LCP array** | WASM (C++) | Build alongside SA; same memory layout |
| **Closed repeat enum** | WASM or JS | O(n log n); WASM preferred for >1MB |
| **Sequitur** | Pure JS initially | Typed arrays + Map; fallback to WASM if >5MB |
| **Center-star alignment** | Pure JS | O(k·L²) for small k; diff-match-patch for pairwise |
| **MDL calculation** | Pure JS | Arithmetic on costs; pure computation |
| **Template matching** | Pure JS | Hash lookup or trie traversal |
| **Slot extraction** | Pure JS | diff-match-patch library; small segments |

### WASM Interface Design

```typescript
// Minimal WASM interface - suffix array only
interface WringSA {
  // Input: Uint32Array of token IDs
  // Output: Uint32Array of suffix positions
  buildSuffixArray(tokens: Uint32Array): Uint32Array;

  // Input: tokens + SA
  // Output: Uint32Array of LCP values
  buildLCPArray(tokens: Uint32Array, sa: Uint32Array): Uint32Array;

  // Input: SA + LCP + parameters
  // Output: List of (start, length, frequency, occurrence_list)
  enumerateClosedRepeats(
    sa: Uint32Array,
    lcp: Uint32Array,
    minLen: number,
    minFreq: number
  ): ClosedRepeat[];
}
```

### Memory Budget (Browser Constraint: ~1GB)

| Input Size | SA Memory | LCP Memory | Working Set | Feasible? |
|------------|-----------|------------|-------------|-----------|
| 1 MB text | 4 MB | 4 MB | ~20 MB | ✓ Yes |
| 10 MB text | 40 MB | 40 MB | ~200 MB | ✓ Yes |
| 50 MB text | 200 MB | 200 MB | ~600 MB | ⚠ Marginal |
| 100 MB text | 400 MB | 400 MB | ~1.2 GB | ✗ Needs sharding |

**Scale-out Strategy**: For inputs >50MB:
1. Use winnowing (k-gram fingerprinting) to identify candidate regions
2. Shard into overlapping 10MB chunks
3. Run SA mining on each shard
4. Merge candidates with cross-shard validation

---

## MDL Cost Function Specification

### Template Cost

```
L(template) = C_overhead + L(literal_tokens) + L(slot_count)

Where:
  C_overhead     = 16 bits (fixed cost for having a template)
  L(literal)     = Σ token_i × 5.5 bits/char (entropy-adjusted)
  L(slot_count)  = γ(slots) = 2⌊log₂(slots)⌋ + 1 bits (Elias gamma)
```

### Slot Value Costs

| Slot Type | Encoding | Cost Formula |
|-----------|----------|--------------|
| **Small integer** (0-1000) | Elias gamma | `2⌊log₂(x)⌋ + 1` bits |
| **Large integer** (>1000) | Elias delta | `log₂(x) + 2log₂(log₂(x)) + 1` bits |
| **Timestamp (sequential)** | Delta + gamma | `γ(t_i - t_{i-1})` bits |
| **String (general)** | Length-prefix + chars | `δ(len) + len × H_char` bits |
| **Enum (low cardinality)** | Dictionary index | `-log₂(P(value))` bits |
| **High-entropy string** | Literal | `len × 8` bits |

### Total Description Length

```
L_total(D, CT) = L(CT) + L(D|CT) + L(residual)

L(CT) = Σ_templates L(template_i)

L(D|CT) = Σ_instances [template_code + Σ_slots L(slot_value)]
        = Σ_instances [-log₂(P(template)) + Σ_slots L(value)]

L(residual) = Σ_uncovered literal_bits × 8
```

### Gain Calculation

```
gain(template) = L(occurrences_as_literal) - L(template) - L(all_slot_values)
               = (freq × literal_len × 5.5) - C_template - L(slots) - Σ L(values)

Accept template IF gain > 0
```

---

## Unresolved Research Questions

### Decision Points Requiring Experimentation

1. **Tokenization granularity threshold**: When should `error_code_42` be treated as one token vs. `error_code_` + `42`? Current heuristic (MDL gain from split) needs empirical validation.

2. **Entropy threshold for slot classification**: H < 1.5 → literal, H > 3.0 → slot. What about 1.5-3.0? Need domain-specific calibration data.

3. **Minimum pattern length in tokens vs. characters**: Q2 suggests 8 characters OR 2-3 tokens. Which is more robust across document types?

4. **Sequitur vs. SA pipeline**: When does grammar induction outperform explicit repeat mining? Preliminary hypothesis: Sequitur better for highly repetitive (>70% redundancy), SA better for moderate redundancy with long templates.

5. **Streaming vs. batch trade-offs**: Progressive alignment (Spell-style) trades accuracy for speed. Quantify the accuracy loss for different redundancy levels.

### Areas Needing Further Investigation

6. **Hierarchical template nesting**: Current architecture produces flat templates. Sequitur naturally produces hierarchy—how to preserve/expose this when using SA mining?

7. **Incremental updates**: When new text arrives, how to efficiently update the template library without full recomputation?

8. **Cross-document patterns**: Current focus is single-document. Extending to corpus-wide boilerplate detection requires additional winnowing/fingerprinting layer.

9. **Type inference accuracy**: Pre-typing assumes regex patterns for dates/IPs/etc. are sufficient. Need validation on diverse document types; may need ML-based NER for complex cases.

10. **Calibration automation**: Cost function parameters (C_overhead, α in F∝1/L^α) are currently manual. Can these be learned from document statistics?

---

## Domain-Specific Adaptation

### Logs

| Parameter | Setting | Rationale |
|-----------|---------|-----------|
| Pre-typing | Aggressive | Timestamps, IPs, session IDs, hex values |
| Segmentation | Line-based | Newlines are natural boundaries |
| Min frequency | 5+ | High-volume, need strong signal |
| Entropy threshold | 3.0 | Many slot types; tolerate variation |
| Template limit | None | Logs can have thousands of templates |

### Legal/Contract Text

| Parameter | Setting | Rationale |
|-----------|---------|-----------|
| Pre-typing | Minimal | Exact phrasal repeats are the signal |
| Segmentation | Paragraph/section | Larger structural units |
| Min frequency | 2 | Boilerplate may appear exactly twice |
| Entropy threshold | 1.5 | Conservative slot detection |
| Template limit | ~100 | Focus on major clauses |

### HTML/Semi-structured

| Parameter | Setting | Rationale |
|-----------|---------|-----------|
| Pre-typing | Tag-aware | Normalize attribute values, preserve tags |
| Segmentation | DOM-based | Use tag structure as boundaries |
| Min frequency | 3 | Web pages have moderate repetition |
| Entropy threshold | 2.5 | Mixed content in attributes |
| Template limit | ~500 | Many page elements |

### Source Code

| Parameter | Setting | Rationale |
|-----------|---------|-----------|
| Pre-typing | Identifier normalization | `$ID`, `$STR`, `$NUM` placeholders |
| Segmentation | Statement/block | Syntax-aware boundaries |
| Min frequency | 2 | Clone detection even for pairs |
| Entropy threshold | 2.0 | Limited vocabulary |
| Template limit | None | Find all clones |

---

## Validation Strategy

### Unit Tests

1. **Tokenization**: Verify character-class splitting, type detection for known patterns
2. **Closed repeats**: Compare against brute-force on small inputs; verify O(n log n) bound
3. **Alignment**: Test center-star against full MSA on known examples
4. **MDL costs**: Validate encoding lengths match theoretical formulas

### Integration Tests

1. **Round-trip**: Raw text → templates → structured extraction → reconstructed text
2. **Compression ratio**: Compare output size vs. input size; should be significantly smaller for repetitive input
3. **Template stability**: Same input should produce identical templates across runs

### Benchmark Suite

| Test Case | Size | Expected Templates | Target Time |
|-----------|------|-------------------|-------------|
| Apache log (1000 lines) | ~100KB | 10-20 | <1s |
| Legal contract | ~500KB | 50-100 | <5s |
| HTML page collection | ~5MB | 200-500 | <30s |
| Large log file | ~50MB | 100-500 | <5min |

### Anomaly Detection Validation

- Inject known anomalous lines into repetitive logs
- Verify compression ratio for injected lines is >0.8 (poorly compressed)
- Verify normal lines have ratio <0.3 (well compressed)

---

## Appendix: Algorithm Reference

### SA-IS (Suffix Array - Induced Sorting)

Linear-time suffix array construction suitable for WASM implementation:
1. Classify suffixes as S-type or L-type
2. Identify LMS (leftmost S-type) suffixes
3. Recursively sort LMS suffixes
4. Induce remaining suffix positions

Reference: Nong, Zhang, Chan (2009)

### Interval Stack Traversal for Closed Repeats

```
stack = [(0, n, 0)]  # (left, right, lcp_depth)
while stack:
    left, right, depth = stack.pop()
    if right - left >= min_freq and depth >= min_len:
        emit(depth, left, right)  # Closed repeat
    # Split interval by LCP
    for each sub-interval with distinct lcp:
        stack.push(sub_interval)
```

### Center-Star Alignment

```
# Given k sequences S_1, ..., S_k
center = argmin_i Σ_j edit_distance(S_i, S_j)
aligned = [S_center]
for each S_j ≠ S_center:
    alignment = myers_diff(S_center, S_j)
    propagate_gaps(aligned, alignment)
columns = transpose(aligned)
literals = [col for col in columns if all_equal(col)]
slots = [col for col in columns if not all_equal(col)]
```

### Weighted Interval Scheduling DP

```
# Given intervals I_1, ..., I_n sorted by end position
# with weights w_i = MDL gain
p(i) = largest j < i where I_j doesn't overlap I_i

OPT(0) = 0
for i in 1..n:
    OPT(i) = max(w_i + OPT(p(i)), OPT(i-1))

# Backtrack to find selected intervals
selected = []
i = n
while i > 0:
    if w_i + OPT(p(i)) > OPT(i-1):
        selected.append(i)
        i = p(i)
    else:
        i -= 1
```

---

## Conclusion

The Wring system is implementable using mature algorithms from multiple adjacent domains. The five-phase architecture (Abstraction → Segmentation → Mining → Refinement → Extraction) maps directly to proven techniques:

| Phase | Primary Algorithm | Complexity | Domain Origin |
|-------|------------------|------------|---------------|
| Abstraction | Regex + NER tokenization | O(n) | Clone detection |
| Segmentation | Entropy boundary detection | O(n) | Information theory |
| Mining | SA + LCP closed repeats | O(n log n) | Log parsing, wrapper induction |
| Refinement | Center-star + gap entropy | O(k·L²) | Bioinformatics, wrapper induction |
| Extraction | WIS + Myers' diff | O(n log n) | Grammar compression, diff |

The MDL objective function provides the principled foundation for all decisions: tokenization granularity, pattern selection, slot classification, and termination criteria. Implementation should begin with the tokenizer and suffix array core, then progressively add alignment and selection layers.

**Key Risk**: Browser memory constraints limit single-document processing to ~50MB. Larger inputs require sharding strategies (winnowing + merge) that add architectural complexity.

**Key Opportunity**: Once the core pipeline works, it generalizes across domains (logs, legal text, HTML, code) with only parameter tuning, not architectural changes.
