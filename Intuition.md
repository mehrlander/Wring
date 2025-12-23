# Intuitions

## The Beginning

You have text. It has patterns. You want to find those patterns.

You want to discover what the things are so you can see them as things and then see their moving parts.

---

## What Repeats

A recurrence is juicy if it's long and shows up a lot. We could distill it, we could wring it out.

So: repetition, weighted by length.

We know how to count strings that repeat.

---

## What Almost Repeats

Strings can overlap without repeating exactly.

```
The quick brown fox jumps over the lazy dog.
The quick red fox jumps over the lazy cat.
```

As literals, we'd tally "The quick" and, "fox jumps over the lazy."  The rest is distinct.

But there's a shared sequence, and an interloper.  Without the color, it would be a longer shared string.  

The shared strings can be seen as two pairs of commmon bookends, with different middles.  Call the middle a variable, or a slot.  Then call the shared strings literals, and designate the whole structure as a template.

Skeleton + residual = template + slot values.

---

## First Questions

How do we find these templates?  We may want to allow for multiple slots.  And we may have a certain tolerance for how long the slot can be, or an expectation of how much should be shared compared to how much should be different.  

But repeat strings of a length to be interesting may also be rare enough that any "real" template will jump out from a simple tally of shared sequences with weights.  

We could imagine each shared string where it occurs as a representative symbol and cull the rest, so our document is reduced to a string of these symbols. What "words" emerge from that string? 


## Diagram

```
TEMPLATE "proviso"
═══════════════════════════════════════════════════════════════════════

  ┌─────────────────┐   ┌──────┐   ┌───────────────────┐   ┌──────────┐
  │  "PROVIDED,     │   │      │   │  "shall not       │   │          │
  │   That "        │   │agency│   │   exceed $"       │   │  amount  │
  │    LITERAL      │   │ SLOT │   │     LITERAL       │   │   SLOT   │
  └─────────────────┘   └──────┘   └───────────────────┘   └──────────┘
          │                 │                │                   │
══════════╪═════════════════╪════════════════╪═══════════════════╪═════
          ▼                 ▼                ▼                   ▼
INSTANCE 1:
   "...PROVIDED, That the Department shall not exceed $50,000,000..."
                         └────┬────┘                  └────┬────┘
                           agency                       amount

INSTANCE 2:
   "...PROVIDED, That NASA shall not exceed $12,500,000 for..."
                         └┬─┘                 └────┬────┘
                        agency                   amount

INSTANCE 3:
   "...PROVIDED, That the Administrator shall not exceed $8,000..."
                         └──────┬──────┘              └──┬──┘
                              agency                   amount
```

The `...` is the void. The template doesn't speak to it.

---

## Sequential Matching

The template, once found, is a path.

```
Find A. Then find B. Then find C.
```

Not regex. Not arbitrary patterns. Just: these landmarks, in this order. What's between them is captured.

This is weaker than regex but more tractable. Forward-only scan. No backtracking. Easy to debug: which landmark failed?

For structured text—legal documents, log files, forms—this is often enough.

---

## The Slot Count Question

You find instances that differ in two places. Do you have:

- Two slots (tight template, atomic values)
- One slot (loose template, compound value)

LGG says two. Pragmatics might say one.

If the varying parts are adjacent, merging them loses little. If they're separated by substantial invariant text, keeping them separate preserves that structure.

The question: **how much literal survives on the other side of each divergence?**

Short bridge → maybe merge. Long bridge → keep separate.

---

## The Economics of Extraction

Finding a template is free. Using it has costs.

**For a list (contiguous repetition):**
- Loop construct is native
- Data is naturally an array
- Low ceremony

**For scattered repetition:**
- Need to define a function
- Need to gather data or parameterize call sites
- Higher ceremony

The threshold for "worth extracting" differs. A list of 3 items loops naturally. Three similar cards in different files might not be worth coupling.

---

## Open Questions

**Detection:** How do you efficiently find near-duplicate clusters in a large corpus?

**Alignment:** Given candidates, how do you align them to find the literal skeleton?

**Segmentation:** How do you decide slot boundaries when the heuristics conflict?

**Thresholds:** How many instances? How much literal overlap? How sparse the divergence?

**Representation:** What does a template look like as a data structure? As executable code?

**Composition:** Can templates nest? Reference each other? Form a grammar?
