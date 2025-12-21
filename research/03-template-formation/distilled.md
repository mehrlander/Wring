# Distilled Findings: Template Formation

## Executive Summary

Converting repeated spans into parameterized templates requires solving the **granularity dilemma**: when should two co-occurring repeated spans merge into one template versus remain separate? This is the analog of `Diff_EditCost`—a tuning parameter that controls whether the system produces many specific templates (fine-grained) or few generic ones (coarse-grained). The optimal answer lies in **MDL (Minimum Description Length)**: merge spans when their union compresses the document better than treating them separately, balancing model complexity (number of templates, slots) against data encoding cost (slot values, residual). Three algorithmic phases enable this: **anchor-sequence search** finds ordered chains of repeated spans (A–gap–B–gap–C) across occurrences; **offset histograms** reveal whether gaps have consistent structure (narrow peak = fixed delimiter, broad distribution = variable slot); **multi-occurrence alignment** determines which positions are constant literals versus variable slots across all instances.

**Anchor-sequence search** must avoid O(n²) candidate enumeration. Efficient approaches include emitting an event stream of (position, anchorID) tuples and using **sliding window joins** to find frequent pairs in O(n·W) time where W is a small window size. This builds a DAG where nodes are anchors and edges represent frequent co-occurrence—paths through this graph are candidate templates. Suffix-based positional indexes enable linear-time intersection of occurrence lists. **Offset histogram analysis** computes the distribution of distances `pos(B) - pos(A)` for each anchor pair: a Dirac delta (single peak) indicates rigid coupling suggesting merge; multimodal peaks suggest discrete variation (enum slots); Gaussian spread indicates elastic variable-length fields; uniform distribution means no structural relationship. This spatial analysis distinguishes structure from coincidence.

**Multi-occurrence alignment** transforms multiple raw instances into a structured template by determining literal versus slot columns. **Center-star alignment**—choose a median instance as center, align all others to it pairwise—provides a 2-approximation to optimal MSA in polynomial time versus exponential for full dynamic programming. Progressive alignment (used in Spell, RoadRunner) iteratively merges instances by computing LCS and generalizing on differences. **Gap entropy** serves as the stitching heuristic: high Shannon entropy (many distinct values, unpredictable) signals a true parameter slot; low entropy (few values, predictable) suggests the gap is actually a missed literal that should merge adjacent anchors. **Token-level MDL refinement** splits tokens like `cpu_load=99%` into `cpu_load=` (literal) + `99%` (slot) when the split reduces total description length—the `=` boundary becomes a slot edge. Template merging decisions use thresholds: minimum literal length (≥3 tokens prevents over-generalization), maximum slot count (≤4 maintains interpretability), minimum occurrences (≥3 filters noise), and compression gain (bytes saved must exceed threshold).

## Key Insights

- **Granularity knob = merge cost function**: Optimal merging isn't a static threshold but a composite function of offset variance (spatial consistency), gap entropy (informational diversity), and co-occurrence frequency (structural coupling)—tuning these weights controls fine vs. coarse templates
- **Offset histogram topology is diagnostic**: Shape encodes gap semantics—Dirac delta (merge, it's a delimiter), discrete modes (enum slot), Gaussian (string slot), uniform (unrelated); this spatial analysis complements content-based entropy measures
- **O(n) anchor-sequence search is mandatory**: Naive pairwise checking is O(n²); sliding window joins over anchor event streams achieve O(n·W) by only examining local neighborhoods; frequent itemset mining with position lists scales via vertical intersection
- **Center-star beats full MSA**: Multi-sequence alignment is NP-hard; center-star (pick median, align all to it) runs in O(k·L²) for k occurrences of length L and guarantees 2-approximation—sufficient for logs where a clear prototype exists
- **Gap entropy determines merge**: High H(gap) = many distinct values → parameter slot (e.g., usernames); low H(gap) = few/single value → missed literal, merge anchors (e.g., always "successfully" between "User" and "logged")
- **Token splitting via MDL**: Treating `key=value` as one token wastes encoding; splitting to `key=` (literal) + `value` (slot) reduces model cost when the prefix repeats—calculate Δ MDL to decide when boundaries should refine
- **Template merge heuristics form cascade**: Apply sequentially—(1) min literal length ≥3 tokens blocks noise, (2) max slots ≤4 prevents unreadable wildcards, (3) compression gain threshold ensures benefit exceeds overhead, (4) gap entropy confirms semantic coherence
- **Progressive alignment trades accuracy for speed**: Spell/RoadRunner align iteratively (seed template + new instance → generalized template); faster than center-star but risks "once a gap, always a gap" errors from early decisions; suitable for streaming but revisable center-star better for batch
- **Event stream abstraction reduces dimensionality**: Transforming raw text to (pos, anchorID) events converts high-dimensional string problem to discrete sequential pattern mining—enables graph-based skeleton assembly and histogram analysis
- **Slot boundary alignment with token edges**: Slots should span whole tokens (or known field delimiters) not fragment words mid-stream; exceptions allowed when common prefix/suffix extraction (like ERR in ERR42) improves MDL—but requires character-level secondary alignment

## Recommendations

| Phase | Technique | Algorithm/Heuristic | Rationale |
|-------|-----------|---------------------|-----------|
| **1. Anchor discovery** | Repeated span detection | Closed repeats from SA+LCP (per Q2) | Provides candidate literal segments with occurrence lists |
| **2. Sequence search** | Co-occurrence mining | Sliding window join (window size W=10–20 tokens) | O(n·W) time; emits frequent pairs (A, B) without O(n²) enumeration |
| | Graph construction | DAG with anchors as nodes, edges = freq pairs | Paths = candidate template skeletons; transitive reduction prunes redundancy |
| **3. Gap profiling** | Offset analysis | Histogram of `pos(B) - pos(A)` for each pair | Narrow peak (var < ε) → merge; broad → slot; uniform → unrelated |
| | Entropy calculation | Shannon H over gap content values | H < 1.5 → merge (missed literal); H > 3.0 → slot (true variable) |
| | Frequency gating | Only compute for support > σ and distance < D_max | Avoid quadratic blowup on dense anchors |
| **4. Multi-alignment** | Primary method | Center-star: pick median-length instance, align all to it | O(k·L²) vs exponential for full MSA; 2-approximation guarantee |
| | Alternative for streaming | Progressive LCS (Spell-style) | Each new instance updates template; greedy but fast; suitable for incremental parsing |
| | Alignment algorithm | LCS or edit distance with gap penalties | Identifies common token subsequence = literals; differences = slots |
| **5. Slot boundaries** | Tokenization | Split on punctuation + digit/letter boundaries | `userID=12345` → `userID`, `=`, `12345`; align slots to token edges |
| | Refinement | MDL test for token splits | If Δ MDL > 0, split token at common prefix/suffix to extract literal component |
| | Validation | All slot values share no common pre/suffix | If they do, extract that substring as literal; re-align |
| **6. Merge decision** | Minimum literal | Require ≥3 static tokens after merge | Prevents over-generic "* : *" templates that convey no structure |
| | Maximum slots | Allow ≤4 slots per template | Maintains interpretability; too many wildcards obscure pattern |
| | Minimum occurrences | Template must cover ≥3 instances (or ≥2 if very long) | Filters coincidental repeats; adjust threshold by domain |
| | Compression gain | Bytes saved ≥ threshold (dynamic: K/L^α) | Only merge if net MDL reduction exceeds cost of adding template/slots |
| | Gap entropy | Require H(gap) < ε to merge (or > ε to separate) | Semantic check: low entropy → structural coupling; high → independence |
| **7. Global optimization** | Objective function | Total MDL = Σ(template costs) + Σ(slot encoding) + residual | Globally minimize description length over all templates and assignments |
| | Merge cost formula | C_merge(A,B) = α·Var(offset) + β·H(gap) - γ·Jaccard(A,B) | Composite score; tune (α,β,γ) for domain; threshold τ controls granularity |
| | Iterative refinement | Greedy hill-climbing or beam search over template set | Start with closed repeats, iteratively merge pairs with best ΔD ML until convergence |

### Implementation Notes for JS/WASM

- **Anchor event streams**: Convert anchors to integer IDs; emit `[(pos, id), ...]`; use Map for frequency counting
- **Sliding window**: Fixed-size queue (deque); for each position, emit all pairs within window; Count-Min Sketch for memory-bounded counting in streams
- **Offset histograms**: Sparse array or Map; detect peaks via simple threshold on frequency or statistical mode-finding
- **Center-star alignment**: Compute pairwise edit distances (O(L²) DP), pick min sum; LCS via standard DP in JS for L < 1000; WASM for longer
- **Gap entropy**: Maintain frequency map per gap position; compute Shannon entropy or just distinct count / max frequency ratio
- **MDL calculation**: Define encoding costs (template literal = L, slot = S·log(V) where V = vocab of values); sum over all instances
- **Token splitting**: Regex-based detection of common boundaries (`=`, `:`, digit/letter transitions); test MDL before/after split
