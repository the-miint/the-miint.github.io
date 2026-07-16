# Qiita

!!! warning "In active development"

    Qiita is under active development and is **not yet ready for production
    use**. This page describes the project's goals and architecture. APIs,
    schemas, and deployment details are changing frequently — follow the
    [repository](https://github.com/the-miint/Qiita) for current status.

**Qiita** is a scalable, multi-omic platform for managing, processing, and
analyzing microbiome data — amplicon, metagenomic, metatranscriptomic,
metabolomic, and proteomic. It is designed from the ground up for **millions of
samples and hundreds of terabytes of data**, with a schema informed by the
established Qiita data model and BioSample.

[duckdb-miint](../duckdb-miint/index.md) is Qiita's analytical engine: every
bioinformatics SQL operation in the platform runs through the extension.

## Architecture

Qiita is built as a small set of focused, independently deployable services:

<div class="grid cards" markdown>

-   :material-api:{ .lg .middle } &nbsp;__Control plane__

    ---

    *Python / FastAPI.* The REST API — study, sample, and prep CRUD, search,
    and work-ticket issuance.

-   :material-transit-connection-variant:{ .lg .middle } &nbsp;__Data plane__

    ---

    *Rust / Arrow Flight.* Bulk data I/O over gRPC, backed by DuckDB and
    DuckLake over Parquet.

-   :material-cog-transfer:{ .lg .middle } &nbsp;__Compute orchestrator__

    ---

    *Python / FastAPI.* Job lifecycle — submit, poll, verify, and report,
    driving batch compute via `slurmrestd`.

-   :material-share-variant:{ .lg .middle } &nbsp;__Common__

    ---

    *Python.* Shared Pydantic models, configuration, and REST-client
    utilities used across the services.

</div>

## Design goals

- **Scale first.** Millions of samples and hundreds of TB are the design
  target, not an aspiration bolted on later.
- **Multi-omic by default.** One coherent model spanning amplicon through
  proteomics, rather than a tool per data type.
- **Columnar and SQL-native.** Analysis rides on DuckDB + Parquet through
  [duckdb-miint](../duckdb-miint/index.md), keeping heavy computation close to the data.
- **Correct and reproducible.** Operations are test-driven and validated
  against reference tools.

## Follow along

Development happens in the open. The source, issues, and current status live on
GitHub:

[:octicons-mark-github-16: the-miint/Qiita](https://github.com/the-miint/Qiita){ .md-button .md-button--primary }
