# Discovery

## The Symbol Reduction Idea

Start with text. Find repeated strings. Replace each repeated string with a symbol. What's left?

A shorter string. Made of symbols and residue.

Now ask: what repeats *in this new string*?

---

## A Worked Example

```
The quick brown fox jumps over the lazy dog.
The quick red fox jumps over the lazy cat.
The slow brown fox jumps over the lazy dog.
The slow red fox jumps over the lazy cat.
```

**Step 1: Find repeating substrings**

Scan for strings that appear more than once. Rank by `length × frequency`:

| String | Length | Frequency | Score |
|--------|--------|-----------|-------|
| `The ` | 4 | 4 | 16 |
| ` fox jumps over the lazy ` | 26 | 4 | 104 |
| `quick ` | 6 | 2 | 12 |
| `slow ` | 5 | 2 | 10 |
| `brown ` | 6 | 2 | 12 |
| `red ` | 4 | 2 | 8 |
| `dog.` | 4 | 2 | 8 |
| `cat.` | 4 | 2 | 8 |

**Step 2: Assign symbols**

Replace each repeated string with a placeholder:

```
A = "The "
B = " fox jumps over the lazy "
```

The document becomes:

```
A quick brown B dog.
A quick red B cat.
A slow brown B dog.
A slow red B cat.
```

**Step 3: Look again**

Now what repeats in *this* reduced string?

| Pattern | Frequency |
|---------|-----------|
| `A quick ` | 2 |
| `A slow ` | 2 |
| `brown B dog.` | 2 |
| `red B cat.` | 2 |

More symbols:

```
C = "A quick "
D = "A slow "
E = "brown B dog."
F = "red B cat."
```

Document becomes:

```
C E
C F
D E
D F
```

**Step 4: Pattern emerges**

The reduced document is now a 2×2 grid. Every line is `{C|D} {E|F}`.

The structure: two independent slots.

---

## The Collapse

Each reduction step collapses variation. The original 4 sentences become 4 two-symbol sequences. The 4 two-symbol sequences reveal a pattern: `SLOT1 SLOT2` where each slot has 2 values.

This is the template:

```
TEMPLATE: $1 $2
$1 := {C, D} = {"The quick ", "The slow "}
$2 := {E, F} = {"brown fox jumps over the lazy dog.", "red fox jumps over the lazy cat."}
```

Or, expanding:

```
TEMPLATE: "The " $speed " " $variant " fox jumps over the lazy " $ending
$speed := {quick, slow}
$variant := {brown, red}
$ending := {dog., cat.}
```

Wait—that's three slots. Where did three come from?

Because `$variant` and `$ending` co-vary. Brown always goes with dog. Red always goes with cat. They're correlated slots.

The 2-slot template (C/D × E/F) captures the surface structure. A deeper analysis might notice the correlation and split E and F into their components.

---

## When to Stop

Symbol reduction is recursive. You can keep going until:

1. **Nothing repeats.** The reduced string is all unique symbols.
2. **Repeats are too short.** Single-symbol patterns aren't useful.
3. **Diminishing returns.** Each pass captures less redundancy.

The art is knowing when to stop. Too early: miss structure. Too late: over-abstract into meaningless symbols.

---

## The Vocabulary Question

As we assign symbols, we're building a vocabulary:

```
A = "The "
B = " fox jumps over the lazy "
C = "A quick " = "The quick "
D = "A slow " = "The slow "
...
```

This is a grammar. Each symbol is a production rule. The final reduced string is a sequence of rule applications.

This is exactly what Sequitur does—but Sequitur finds exact repeats only. The slot insight is: what if we allow symbols to represent *almost* identical strings?

---

## Tolerances

The question from Intuition.md: how much can strings differ and still be "the same template"?

Parameters:

| Parameter | Question |
|-----------|----------|
| **Minimum literal length** | How short can a shared bookend be? |
| **Maximum slot length** | How long can the varying part be? |
| **Slot count limit** | How many varying positions in one template? |
| **Shared/different ratio** | What fraction must be literal vs slot? |

These are knobs. Different settings produce different templates.

**Conservative settings** (long literals, short slots, few slots):
- Finds rigid patterns
- Misses flexible ones
- Good for boilerplate

**Liberal settings** (short literals, long slots, many slots):
- Finds loose patterns
- Might over-generalize
- Good for exploratory discovery

---

## Finding Templates with Multiple Slots

Consider:

```
User 123 logged in at 10:00
User 456 logged in at 10:05
User 789 logged in at 10:10
```

Symbol reduction:

```
A = "User "
B = " logged in at "
```

Reduced:

```
A 123 B 10:00
A 456 B 10:05
A 789 B 10:10
```

Now what repeats?

```
"A " appears 3 times
" B " appears 3 times
```

But `A...B` with stuff in between also repeats 3 times. The *sequence* A-then-B is the template. The stuff in between is slots.

**Template discovery = finding repeated symbol sequences with consistent gaps.**

---

## The Sequence Search

After assigning symbols to repeated strings, search for repeated *sequences* of symbols:

1. **Bigrams**: Which pairs of symbols appear together (in order, with gap)?
2. **Trigrams**: Which triples?
3. **N-grams**: General case.

For each repeated sequence, the gaps become candidate slots.

**Example:**

```
Reduced document: A x B y C   A x' B y' C   A x'' B y'' C
Repeated sequence: A _ B _ C (appears 3 times)
Slots: position 1 (x/x'/x''), position 2 (y/y'/y'')
```

This is anchor-sequence search from the main research, but now grounded in the intuition of symbol reduction.

---

## The Words That Emerge

Back to the original question:

> We could imagine each shared string where it occurs as a representative symbol and cull the rest, so our document is reduced to a string of these symbols. What "words" emerge from that string?

Words = repeated symbol sequences.

The "vocabulary" of the reduced document reveals the template structure:

- **Frequent words** = core templates (high-value patterns)
- **Rare words** = edge cases or noise
- **Single-occurrence words** = unique content (residual)

A word that appears exactly once is not a template. A word that appears many times, with varying content in the gaps, is a template with slots.

---

## Co-occurrence and Correlation

Some slots move together:

```
Template: "Hello $name, your order $id is $status"

Instance 1: name=Alice, id=1001, status=shipped
Instance 2: name=Bob, id=1002, status=pending
Instance 3: name=Alice, id=1003, status=shipped
```

Are `name` and `status` correlated? Alice → shipped? If the correlation is strong, maybe there's a sub-template:

```
Template: "Hello $customer_type"
$customer_type := {
  "Alice, your order $id is shipped",
  "Bob, your order $id is pending"
}
```

Slot correlation analysis is a post-discovery step. First find the slots. Then study their joint distribution.

---

## The Weighting Question

Not all repeated strings are equally valuable. The intuition: `length × frequency`.

But there's more nuance:

| Factor | Weight influence |
|--------|------------------|
| **Length** | Longer = more compression = more valuable |
| **Frequency** | More occurrences = more reuse = more valuable |
| **Uniqueness** | String appears nowhere else = strong signal |
| **Position** | At template boundaries (start/end) = structural |
| **Content type** | Punctuation/structure vs content words |

A short string that appears at the start of every paragraph might be more structurally important than a long phrase that appears twice.

---

## Rarity and Signal

From Intuition.md:

> Repeat strings of a length to be interesting may also be rare enough that any "real" template will jump out from a simple tally of shared sequences with weights.

This is the hope: in real documents, meaningful patterns are rare enough to stand out.

In a legal document:
- "PROVIDED, That" appears 50 times → obvious template anchor
- "the" appears 10,000 times → too common, not structural
- "appropriations for fiscal year 2024" appears 3 times → interesting, specific

The distribution is typically power-law. A few strings appear often. Most strings appear once or twice. The sweet spot: strings that appear enough to matter but not so often they're meaningless.

---

## Algorithm Sketch

```
1. Tokenize document into stream

2. Find all repeated substrings
   - Build suffix array, enumerate repeats
   - Or run Sequitur for exact-repeat grammar

3. Rank by length × frequency
   - Filter: minimum length, minimum frequency
   - Output: candidate anchors

4. Assign symbols to top anchors
   - Replace each anchor occurrence with its symbol
   - Preserve positions for later mapping

5. Reduce document to symbol string
   - Interleave: symbol, residue, symbol, residue, ...

6. Find repeated symbol sequences
   - Enumerate n-grams of symbols
   - Look for patterns with gaps

7. Form templates
   - Repeated sequence = literal structure
   - Gaps = slots
   - Collect slot values from instances

8. Iterate or terminate
   - If new patterns found, repeat from step 4
   - If diminishing returns, stop
```

---

## Multiple Iterations

The power of symbol reduction: it's recursive.

**Iteration 1**: Find repeated strings, assign symbols A, B, C...
**Iteration 2**: Find repeated sequences of A, B, C, assign symbols X, Y, Z...
**Iteration 3**: Find patterns in X, Y, Z...

Each level captures structure at a different granularity:
- Level 1: phrases
- Level 2: clauses/templates
- Level 3: sections/document structure

This is how Sequitur works—digram replacement, recursively. The insight here: allow slots (gaps) between the symbols, not just exact adjacency.

---

## What This Document Adds

Intuition.md asked the questions. This document sketches answers:

1. **How do we find templates?**
   → Symbol reduction: replace repeats with symbols, find patterns in the reduced string.

2. **Multiple slots?**
   → Gaps between symbols in a repeated sequence.

3. **Tolerance for slot length?**
   → Configurable parameter; trade-off between rigid and flexible patterns.

4. **What words emerge?**
   → Repeated symbol sequences = templates. Gaps = slots. Frequency = importance.

The next step: formalize the algorithm, implement, test on real documents.

---

## Open Questions

- How to efficiently enumerate repeated symbol sequences with gaps?
- When are two gap patterns "the same" template vs different?
- How to handle overlapping anchors (a repeat that contains another repeat)?
- What's the right stopping criterion for recursive reduction?
- How does this relate to the grammar-first approach (Sequitur + bookend merge)?

---

## Diagram: The Reduction Stack

```
LEVEL 0: Raw text
═══════════════════════════════════════════════════════════════════
"The quick brown fox jumps over the lazy dog. The quick red fox..."


LEVEL 1: First-order symbols (repeated substrings)
═══════════════════════════════════════════════════════════════════
     A          B            A        B
   ┌───┐  ┌─────────────┐  ┌───┐  ┌─────────────┐
   │The│  │fox jumps... │  │The│  │fox jumps... │
   └───┘  └─────────────┘  └───┘  └─────────────┘
     ↓          ↓            ↓          ↓
   "A quick brown B dog. A quick red B cat..."


LEVEL 2: Second-order symbols (repeated symbol sequences)
═══════════════════════════════════════════════════════════════════
       C              D           C             D
   ┌───────┐     ┌────────┐   ┌───────┐    ┌────────┐
   │A quick│     │B dog.  │   │A quick│    │B cat.  │
   └───────┘     └────────┘   └───────┘    └────────┘
     ↓               ↓           ↓              ↓
   "C brown D   C red D ..."


LEVEL 3: Template emerges
═══════════════════════════════════════════════════════════════════
   TEMPLATE: C $color D
   $color := {brown, red}

   Expanding: "The quick $color fox jumps over the lazy $animal."
   $color := {brown, red}
   $animal := {dog, cat}

   (Correlation discovered: brown↔dog, red↔cat)
```

Each level peels away a layer of repetition, exposing the next level of structure.
