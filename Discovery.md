# Discovery: Template Inference via Symbol Reduction

## The Core Concept

A structured document is a stream containing **Repeated Substrings** (Potential Structure) and **Variable Content** (Potential Slots).

Discovery is the process of reducing the document to a stream of symbols and then identifying which symbols flow together to form rigid sequences, even when separated by noise.

-----

## The Process

### 1. Identify Vocabulary (The Nodes)

Find repeated substrings to build the alphabet of the system.

* **Mechanism**: Suffix Arrays or Grammar Induction (Sequitur).
* **Ranking**: Score candidates by Length × Frequency.
* **Action**: Replace high-scoring substrings with unique Symbol IDs ($A, $B, $C...).
* **Result**: The document is reduced to a stream of Symbols interleaved with "Residue" (unique/variable text).

### 2. Infer Topology (The Edges)

Determine the probability of flow between symbols.

* **Premise**: We assume symbols representing structure appear in a set order, but are separated by varied content. This content can include non-structural symbols (decoys) that were also found during vocabulary identification.
* **Mechanism**: Apply Distance Decay or Sequential Pattern Mining.
  * Scan the symbol stream for recurring sequences (e.g., $A... $B).
  * Calculate a consistency score based on how consistently $B follows $A versus the random appearance of decoy symbols.
* **Result**: A Directed Graph where edge weights represent the strength of the connection between two symbols.

### 3. Induce Skeletons (The Paths)

Extract definitive template chains from the topology graph.

* **Action**: Trace the strongest paths (e.g., $A => $B => $C) through the weighted graph.
* **Refinement**: Prune weak branches and low-confidence links.
* **Definition**: A "locked-in" path becomes a Template. The symbols on the path become Literals. The residue trapped between them becomes Slot Data.

-----

## Handling Noise & Decoys

The residue between symbols often contains "Decoys"—repeating words (e.g., "USD", "the") that are assigned symbols but are not part of the structure.

* **Topological Filtering**:
  * Decoy symbols appear at random/inconsistent distances from structural symbols.
  * Structural symbols appear at consistent "lags" relative to each other.
  * **Filter**: Discard edges with high variance in gap length.

-----

## Recursive Reduction

Template discovery is hierarchical. The process can be run recursively:

* **Level 1**: Reduce raw text to Phrase Symbols.
* **Level 2**: Reduce Phrase Symbols to Template Skeletons.
* **Level 3**: Reduce Skeletons to Document Sections.

-----

## Output Definitions

* **Vocabulary**: The set of identified repeated substrings.
* **Template**: A statistically significant sequence of Vocabulary items ($A => $B => $C).
* **Slot**: The variable gap between two Vocabulary items in a Template.
* **Instance**: A specific occurrence of a Template in the raw text, binding specific Residue to the Slots.
