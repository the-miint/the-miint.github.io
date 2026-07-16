---
hide:
  - navigation
  - toc
---

<div class="miint-hero" markdown>
<img class="miint-hero__logo" src="assets/miint-logo.png" alt="MIINT logo — a lightbulb of binary digits with a mint plant growing from it">
<div class="miint-hero__text" markdown>
# Microbiome Intelligence
<p class="miint-hero__tagline">Minting the next generation of microbiome analysis.</p>
<p class="miint-hero__lede">Open, SQL-native tools for microbiome data — from raw sequence and alignment to phylogeny, diversity, and mass spectrometry — built for the scale of modern multi-omic studies.</p>
<div class="miint-hero__cta" markdown>
[Explore duckdb-miint](duckdb-miint/index.md){ .md-button .md-button--primary }
[About Qiita](qiita/index.md){ .md-button }
</div>
</div>
</div>

## Projects

<div class="grid cards" markdown>

-   :material-database:{ .lg .middle } &nbsp;__duckdb-miint__ <span class="miint-pill miint-pill--stable">Available now</span>

    ---

    A **DuckDB extension** that brings columnar analytics to microbiome
    research. Read and write FASTA/FASTQ, SAM/BAM, mzML, Newick and more; run
    alignment, denoising, chimera detection, classification, and UniFrac —
    all in SQL, all fast.

    ```sql
    LOAD miint;
    SELECT * FROM read_alignments('sample.bam')
    WHERE mapq >= 30;
    ```

    [:octicons-arrow-right-24: Documentation](duckdb-miint/index.md)  ·  [:octicons-mark-github-16: Source](https://github.com/the-miint/duckdb-miint)

-   :material-dna:{ .lg .middle } &nbsp;__Qiita__ <span class="miint-pill miint-pill--wip">In active development</span>

    ---

    A **scalable multi-omic platform** for study management, processing, and
    analysis — amplicon, metagenomic, metatranscriptomic, metabolomic, and
    proteomic data. Designed for millions of samples and hundreds of terabytes,
    with duckdb-miint as its analytical engine.

    [:octicons-arrow-right-24: Overview](qiita/index.md)  ·  [:octicons-mark-github-16: Source](https://github.com/the-miint/Qiita)

</div>

## Why MIINT

<div class="grid cards" markdown>

-   :material-flash:{ .lg .middle } &nbsp;__Columnar & fast__

    ---

    Microbiome data lives in big tables. MIINT meets it there — scanning and
    aggregating millions of records with DuckDB's vectorized engine instead of
    row-by-row scripting.

-   :material-check-decagram:{ .lg .middle } &nbsp;__Verifiably correct__

    ---

    Every operation is test-driven and validated against reference tools. When
    a result matters, it is checked — not assumed.

-   :material-connection:{ .lg .middle } &nbsp;__Interoperable__

    ---

    Bridges the file formats and algorithms central to microbiome studies into
    DuckDB's ecosystem — BIOM, SAM/BAM, Newick, mzML, ENA/NCBI, and Parquet.

-   :material-open-source-initiative:{ .lg .middle } &nbsp;__Open__

    ---

    Built in the open at [the-miint](https://github.com/the-miint), standing on
    a foundation of established, best-in-class bioinformatics tools.

</div>
