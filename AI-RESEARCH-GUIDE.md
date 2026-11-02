# AI Research Guide for Sentinel Command

This guide explains how to use AI assistants to explore the public research in this repository, ask questions about its documents and data, and plan source-backed updates.

## 1. What the repository contains

Start with these entry points:

- [Public Research Archive and Output Inventory](PUBLIC-RESEARCH-ARCHIVE.md): map of published research and work awaiting reconstruction.
- [Global Earth System Review](earth-system-global-review/README.md): global Earth-system assessment and data tables.
- [Riyadh OSINT case file](Riyadh-2026-10-03-Full-OSINT-Research-Record.md): dated satellite and multi-source event analysis.
- [F-15 geolocation assessment](Jabal-Haylan-F15-Geolocation-Assessment.md): an uncertain, open-source location assessment.
- [Public OSINT satellite toolkit](public-osint-satellite-toolkit/README.md): generic methods and reusable code.

The repository contains both software and research material. When asking about scientific or geopolitical findings, direct the AI to the research documents rather than assuming that application source code contains those findings.

## 2. Ask GitHub Copilot about the repository

### On GitHub.com

1. Open the [Sentinel Command repository](https://github.com/salehshahab999-gif/sentinel-command).
2. Open Copilot Chat from the repository page when that option is available, or go to [GitHub Copilot](https://github.com/copilot).
3. In a Copilot session, select this repository as the working repository or attach it as context.
4. Ask a focused question and name the relevant file paths.
5. Check the references Copilot used. Open the cited files and verify the underlying source links.

GitHub documents repository-scoped questions and file/context selection in its [Copilot Chat guide](https://docs.github.com/en/copilot/how-tos/copilot-on-github/chat-with-copilot/get-started-with-chat) and [Copilot quickstart](https://docs.github.com/en/copilot/get-started/quickstart-for-using-github-copilot-on-github-com).

### In VS Code

1. Open the cloned `sentinel-command` folder.
2. Sign in to GitHub and open the GitHub Copilot Chat panel.
3. Open the relevant Markdown or CSV file, or attach it directly to the chat.
4. Ask the AI to explain, compare, extract or validate the selected material.
5. Review the file references and original source URLs before relying on the answer.

GitHub's [repository custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/configure-custom-instructions/add-repository-instructions-in-your-ide) describe how the `.github/copilot-instructions.md` file can guide supported Copilot experiences. This repository includes research-specific instructions there.

## 3. Ready-to-use prompts

### Understand the whole research collection

```text
Use this repository as your source context. Explain its public research
collections, their dates, scope, strongest evidence, limitations and the
files I should read first. Cite exact repository paths for every major point.
Do not treat a research summary as a live update.
```

### Ask about the Earth-system dataset

```text
Read:
- earth-system-global-review/README.md
- earth-system-global-review/EXECUTIVE-ASSESSMENT.md
- earth-system-global-review/data/indicator-snapshot.csv
- earth-system-global-review/data/source-register.csv

Answer my question using the files above. For every number, report the
indicator ID, unit, observation period, reference baseline, source ID,
source URL and uncertainty/caveat. Identify missing or conflicting data.
Do not silently average products with different methods.
```

### Compare two sources or datasets

```text
Compare the two named sources using their original definitions. Show
observation period, publication date, product/version, units, spatial
coverage, temporal averaging, baseline and uncertainty. Explain why values
may differ. Do not declare one wrong unless the source evidence supports it.
Cite the exact source URLs and repository file paths.
```

### Prepare a current research update

```text
Prepare a dated update to this repository's research on [TOPIC].
Search for primary sources and at least two independent corroborating sources
where available. Record source publication time separately from observation
time and retrieval time. Separate observed facts, source claims, estimates,
forecasts, analytical inferences and unresolved items. Include source URLs,
product versions, units, baselines, uncertainty and limitations. Do not edit
or commit files yet; first show me the proposed evidence table and changes.
```

### Extract an auditable table

```text
Read the named report and its source register. Build a table containing:
claim, evidence class, value, unit, date/period, geography, source ID,
original source URL, uncertainty and verification status. Preserve unknown
values as unknown. Do not invent missing numbers or citations.
```

### Review a proposed contribution

```text
Review this proposed research update as a skeptical independent reviewer.
Check source provenance, dates, definitions, unit conversions, baselines,
duplicate reporting, uncertainty, unsupported causal claims and broken links.
List confirmed defects separately from questions that still need evidence.
Do not alter application code, databases, APIs or deployment settings.
```

## 4. Evidence rules for AI-assisted research

Ask the AI to follow these rules in every substantive answer:

- **Observed fact:** directly measured data or a clearly identified observation.
- **Source claim:** what an institution, official, media outlet or witness says.
- **Assessment or estimate:** a published synthesis or derived value; preserve its method and uncertainty.
- **Forecast:** a statement about a future period, never a completed observation.
- **Analytical inference:** an explanation derived from evidence; show the reasoning and alternatives.
- **Hypothesis:** a plausible but unconfirmed explanation.
- **Unresolved:** evidence is incomplete, conflicting or unavailable.

For every time-sensitive item, request:
- observation time or period;
- publication time;
- retrieval time and timezone;
- source or dataset version;
- units, reference baseline and geographic coverage;
- uncertainty, data gaps and known conflicts.

Prefer original data portals and national or international agencies over copied summaries. Media reports and forum posts can provide leads, but they are not interchangeable with independently verified observations. Multiple outlets repeating one original report do not constitute multiple independent sources.

## 5. Important limits of GitHub Copilot

Copilot can help explain repository files, locate relevant material and summarize context. Its repository indexing is designed to improve context-based answers; GitHub states that indexed repository content is not used to train its models. See [Repository indexing for Copilot](https://docs.github.com/en/copilot/concepts/prompting-and-context/repository-indexing).

However, GitHub describes Copilot Chat as primarily intended for coding-related questions and does not recommend it as a general-purpose source for non-coding research. See [Responsible use of Copilot Chat](https://docs.github.com/copilot/responsible-use/chat-in-github). Availability of repository context, web search and other features depends on the Copilot client, account and policy settings.

For current science, markets, conflict reporting, aviation notices or shipping activity, use an AI assistant with a live web/data search capability, and ask it to verify original sources. A model's ability to read this repository does not mean it has independently checked the live world.

AI output is a research aid, not an authoritative source. Open the original link, verify the method and date, and preserve uncertainty before citing or publishing a conclusion.

## 6. Repository privacy and safe publication

This repository is public. Any committed file may be viewed, copied, indexed or reused by other people.

Do not add:
- private chat transcripts or user-authored messages;
- personal or health information;
- passwords, API keys, tokens, cookies or private URLs;
- personal computer paths or network configuration;
- private database records or deployment secrets.

For geospatial OSINT, use an explicit public-interest and safety review. Generalize or omit precise operational coordinates and details that could materially enable targeting of sensitive infrastructure.

## 7. Official documentation

- [Ask Copilot questions on GitHub](https://docs.github.com/en/copilot/how-tos/copilot-on-github/chat-with-copilot/get-started-with-chat)
- [Quickstart: Copilot on GitHub.com](https://docs.github.com/en/copilot/get-started/quickstart-for-using-github-copilot-on-github-com)
- [Repository custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/configure-custom-instructions/add-repository-instructions-in-your-ide)
- [Repository indexing](https://docs.github.com/en/copilot/concepts/prompting-and-context/repository-indexing)
- [Responsible use of Copilot Chat](https://docs.github.com/copilot/responsible-use/chat-in-github)
