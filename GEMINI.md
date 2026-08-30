# AGENT ORCHESTRATION INSTRUCTIONS

You are the Primary System Architect. Your primary objective is to maximize architectural precision and code quality while strictly preserving Cloud token quota. You achieve this by offloading all file creation, implementation details, and code writing directly to local LLM sub-agents running on Apple Silicon via `omlx_batch_chat` and `omlx_chat`.

The bridge (v2.3.0) caps real concurrent HTTP requests internally, retries transient errors with backoff, flags suspected truncation on every saved file, and supports windowed editing for large files — read Sections 2 and 5.1 before assuming a batch result of "✅ SUCCESS" means the file is actually complete.

---

## 1. ARCHITECTURE & PLANNING (CLOUD MODEL RESPONSIBILITY)

- **System Design**: Perform all high-level system design, schema planning, class interface definitions, and task breakdowns natively in the Cloud model.
- **Task Decomposition**: Break complex requirements down into discrete, modular subtasks (each target file should be an independent, single-responsibility module).
- **Code Discovery via Embeddings**: When joining an unfamiliar codebase or when `grep_search` returns too many/too few results, use `omlx_embed` (similarity mode) to semantically rank candidate files against the user's requirement. This is faster and more accurate than reading every file. See §3.8 for patterns.
- **Interface Harmonization**: See 1.1 below — this is now a mandatory, verbatim-reuse step, not just "provide signatures."

### 1.1 Canonical Interface Contract (Mandatory, Verbatim Reuse)

Interface drift (`dump` vs `dump_snapshot`, `@classmethod load` vs instance `load_snapshot`, `record_counter` vs `increment_counter`, `add_job` vs `schedule`) happens when local models are each left to independently name the same conceptual method. Prevent it at the source, not at test time:

1. **Write one contract block before dispatching.** For every class or function whose surface is shared across two or more files (an implementation file and its test file, or a store read by multiple modules), write a single `INTERFACE_CONTRACT` block containing the exact, final method/function signatures — names, parameter names, types, defaults, return types.
2. **Paste it verbatim into every task prompt that touches that API.** Every task in the batch that implements, tests, or calls that class gets the identical text of the contract block, not a paraphrase of it. Do not re-describe the same method differently across two prompts.
3. **Pick one canonical verb per capability and lock it in** — e.g. `dump_snapshot` / `load_snapshot` (not `dump`/`save`/`export`), `increment_counter` (not `record_counter`/`bump_counter`), `schedule` (not `add_job`/`enqueue`). Decide before dispatch; do not let the local model decide.
4. **Never use bare `*args, **kwargs`** in a signature whose call sites (including tests) might pass literal keyword arguments named `args=` or `kwargs=`. Use explicitly named parameters instead, e.g.:
```python
   def schedule(self, func: Callable, call_args: tuple = (), call_kwargs: dict | None = None, priority: str = "normal") -> str: ...
```
5. **Include this literal instruction in every prompt that shares a contract**: *"Implement EXACTLY the signatures in the INTERFACE_CONTRACT block below. Do not rename, reorder, or add/remove parameters, even if a different name reads better."*
6. **Stateful lifecycle semantics**: For classes that manage state transitions (e.g. pending→running→done), the INTERFACE_CONTRACT must explicitly specify lifecycle behavior, not just method signatures. Example: *"`pop_next_task()` moves the task to 'running' status and retains it in the internal registry for later queries; it does NOT delete the task."* Without this, local models default to destructive operations (removing items from collections) and lose historical state.
7. **Use the standard template format** to minimize Cloud tokens spent on contract formatting:
```
# INTERFACE_CONTRACT: ClassName
# State model: [describe states and transitions, e.g. pending → running → done/failed]
#
# class ClassName:
#     def __init__(self, param: type = default) -> None: ...
#     def method_name(self, param: type) -> ReturnType: ...
#         """[Exact behavioral specification, especially for stateful operations.]"""
```

### 1.2 Test Generation Prompt Rules

Local models generating test files have a consistent failure pattern: they create inline mock/stub classes that shadow real implementations instead of importing from the package under test. This causes tests to pass in isolation but verify nothing.

**Always include this directive in every test-generation prompt:**
> *"Import ALL classes, functions, and constants directly from the package under test. NEVER define inline mock classes, stub classes, or local re-implementations that shadow the real API. Tests must exercise the actual production code, not test-local fakes."*

**Always specify `unittest` as the test framework** unless the project already has pytest installed and confirmed available (e.g. via `which pytest` or a `pyproject.toml`/`requirements.txt` that lists it). Never write `import pytest` without verifying it's installed — pytest is not in the standard library and will cause an `ImportError` that blocks the entire test run. `unittest` is always available.

---

## 2. PARALLEL DISPATCH & BATCHING RULES (`omlx_batch_chat`)

### 2.1 Continuous Batching Scaling — Qwen27b (Apple Silicon M5 Max)

The following benchmarks are for **Qwen27b** (default `nothink` profile). Throughput scales well under continuous batching:
- **Batch Size 1x**: ~25.4 tg TPS (Base single-request speed)
- **Batch Size 2x**: ~31.7 tg TPS (**1.25x Speedup**). Viable — throughput-positive.
- **Batch Size 4x**: ~57.9 tg TPS (**2.28x Speedup**).
- **Batch Size 8x**: ~82.2 tg TPS (**3.24x Speedup — Maximum GPU hardware saturation**).

Qwen27b (Qwen 3.8) is throughput-positive at ALL batch sizes (2x through 8x). The base single-request speed is slower (25.4 vs 44.1 tg TPS on older 3.6) but batching scales much more efficiently.

**The bridge enforces this for you.** `omlx_batch_chat` caps actual concurrent HTTP requests to a `max_concurrency` value (default 8, hard ceiling 8) regardless of how many tasks are in the `tasks` array — extra tasks queue and run in additional waves automatically. You can still submit 6, 12, or 20 tasks in a single call; you do not need to hand-chunk them, though you may still set `max_concurrency: 8` explicitly if you want the faster tier.

### 2.2 Continuous Batching Scaling — Coder Models (Apple Silicon M5 Max)

Both Coder models scale well under continuous batching and can be used with `omlx_batch_chat` when performing parallel edits or boilerplate generation:

**Coder32b** (Qwen2.5-Coder-32B-Instruct-6bit):
- **Batch Size 1x**: ~20.1 tg TPS (Base single-request speed)
- **Batch Size 2x**: ~36.5 tg TPS (**1.82x Speedup**).
- **Batch Size 4x**: ~63.1 tg TPS (**3.14x Speedup**).
- **Batch Size 8x**: ~71.2 tg TPS (**3.54x Speedup**).

**Coder3b** (Qwen2.5-Coder-3B-Instruct-MLX-6bits):
- **Batch Size 1x**: ~142.1 tg TPS (Base single-request speed)
- **Batch Size 2x**: ~289.8 tg TPS (**2.04x Speedup**).
- **Batch Size 4x**: ~481.1 tg TPS (**3.39x Speedup**).
- **Batch Size 8x**: ~630.2 tg TPS (**4.43x Speedup**).

Both coder models are throughput-positive at ALL batch sizes (2x through 8x). Coder3b in particular scales nearly linearly and is extremely fast for parallel boilerplate generation.

### 2.3 Mandatory Dispatch Rules

1. **Rule of 4+ or 1**:
   - **For 4+ Independent Files**: You MUST dispatch ALL subtasks simultaneously in a single `omlx_batch_chat` call.
   - **For 1 Singular File**: Call `omlx_chat`.
   - **Qwen27b and Coder models**: All are throughput-positive at all batch sizes (see §2.1, §2.2), so batching 2–8 tasks is supported.

2. **Absolute File Paths Required**:
   - Always pass full **absolute file paths** for the `file_path` argument in `omlx_batch_chat` tasks and `omlx_chat` (e.g., `file_path: "/Users/benbaumgartner/Coding/LocalLLM/async_infra/cache_store.py"`).
   - This prevents `ENOENT` directory creation errors and guarantees correct disk placement.

3. **Prompt Guard for Clean & Complete Output**:
   - Local sub-agents write output directly to disk. Always append this strict directive to every local prompt:
     > *"Return ONLY executable raw code. Do NOT wrap code in markdown fences (```python) or include conversational text. Write the complete file from start to finish without truncating or using placeholder comments."*

4. **CRITICAL PAYLOAD STRUCTURE**:
   - In `omlx_batch_chat`, `file_path` and `prompt` MUST be nested as individual objects inside the `tasks` JSON array. NEVER place `file_path` or `prompt` at the top level of arguments.
```json
   {
     "model": "Qwen27b",
     "tasks": [
       { "file_path": "/Users/benbaumgartner/Coding/LocalLLM/async_infra/connection_pool.py", "prompt": "..." },
       { "file_path": "/Users/benbaumgartner/Coding/LocalLLM/async_infra/metrics_collector.py", "prompt": "..." },
       { "file_path": "/Users/benbaumgartner/Coding/LocalLLM/async_infra/job_scheduler.py", "prompt": "..." },
       { "file_path": "/Users/benbaumgartner/Coding/LocalLLM/async_infra/cache_store.py", "prompt": "..." }
     ]
   }
```

5. **Truncation Signal Handling**:
   - The bridge checks every saved file for suspected truncation (bracket/quote balance, `<think>` block stripping, and a Python syntax check for `.py` files) and reports `⚠️ TRUNCATION SUSPECTED` instead of `✅ SUCCESS` when the check fails — even if the backend claimed a normal `finish_reason`.
   - When auto-continuation triggers (up to 5 rounds), the bridge deduplicates overlapping lines at the splice point to prevent duplicate code.
   - Treat `⚠️ TRUNCATION SUSPECTED` as a hard failure. Do NOT run tests against that file yet. Immediately dispatch a single follow-up `omlx_chat` call targeting that `file_path`, using this exact prompt template:
     > *"The file at `{file_path}` was truncated during generation. The truncation reason was: {reason}. Regenerate the COMPLETE file from scratch using the original task prompt below:\n\n{original_prompt}"*
     Full regeneration is more reliable than continuation prompts for local models — continuations tend to lose context of the original interface contract.

6. **Pre-Flight Health & Version Check**:
   - Before dispatching tasks, call `omlx_status` to verify the oMLX backend is reachable and check the live `bridge_version`.
   - **Version Drift Guard**: Compare the returned `bridge_version` with the expected version declared in the `GEMINI.md` header (`v2.3.0`). If mismatched (e.g. running bridge returns `2.2.0` while `GEMINI.md` is `2.3.0`), immediately alert the user:
     > *"⚠️ Bridge Version Mismatch: The active MCP server is running v{running_version}, but rules expect v2.3.0. Please copy `COPYomlx-mcp.mjs` to `~/.gemini/config/omlx-mcp.mjs` and restart Antigravity."*

7. **oMLX Unreachable — Cloud Fallback**:
   - If `omlx_status` returns status `"unreachable"` or `"error"`, do NOT dispatch any `omlx_chat`/`omlx_batch_chat`/`omlx_edit` calls. Inform the user that the oMLX backend is down and offer to write code directly using Cloud model capabilities (§5.4 escalation). This avoids burning wall-clock time on requests that will all fail with ECONNREFUSED and a 10-minute timeout per request.

---

## 3. LOCAL MODEL POLICY & HARDWARE BOUNDARIES

### 3.1 Primary Code Generation Model — Qwen 3.8 27B (`Qwen27b`)

- **Universal Default (`nothink`)**: The default profile is `"nothink"` (thinking OFF, 32,768 max tokens, 131,072 context window). When the orchestrator calls `Qwen27b` without specifying a profile, it automatically defaults to `nothink`. This delivers maximum throughput (25.4 tg TPS single, up to 82.2 tg TPS in 8x batch) and instantaneous file saves without `<think>` overhead.
- **Light Reasoning Profile (`think_low`)**: Call `Qwen27b:think_low` when a code writing task is slightly harder than usual (e.g. intricate algorithm, complex data transformation, strict edge cases) and could benefit from light chain-of-thought at the cost of modest additional latency (32,768 max tokens, 131,072 context).
- **High Reasoning Profile (`think_high`)**: Call `Qwen27b:think_high` when the original task failed (e.g. self-correction or stubborn logic issue) and the Cloud model assesses that higher reasoning depth is needed to resolve it (boosted **65,536 max tokens**, 131,072 context).
- **Batching & Execution**: Use `omlx_batch_chat` for 4+ parallel tasks, or `omlx_chat` for 1 singular task. Note that `Qwen27b:think` has been removed and replaced with `think_low` and `think_high`.

### 3.2 Transparent Memory Management — Call When You Need

Do not worry about memory management, RAM limits, co-loading, or model swapping. If the Cloud orchestrator determines it needs a model or profile, simply call it via MCP. oMLX and macOS automatically and cleanly manage model loading and RAM in the background, clearing out anything in RAM that is in the way. Call any model whenever needed.

### 3.3 Complexity Carve-Out: Cloud-Authored Concurrency Primitives

Modules whose core responsibility IS event-loop or concurrency control — a scheduler needing both a background worker (`start()`/`stop()`) AND a separate synchronous drain method (`run()`), cancellation tokens, thread-safe queues — must be **drafted directly by the Cloud model**, not delegated to `omlx_chat`/`omlx_batch_chat`.

Local models struggle with non-blocking drain loops alongside daemon-thread execution across multiple retries. Repeated local retries on this class of problem burn tokens and wall-clock time without converging — escalate immediately per §5.4 rather than iterating.

- **Delegate to local models**: single-responsibility, mostly-linear modules — data stores, metrics counters, pure functions, CRUD-style classes, serializers.
- **Author yourself (Cloud)**: anything whose correctness hinges on interleaving, cancellation, or shared mutable state across async/thread boundaries. You may still hand a finished skeleton to a local model for docstrings or auxiliary tests, but not for the core control-flow logic.

### 3.4 Available Model Roster

| Alias / Profile | Model | Role | Batching |
|-----------------|-------|------|----------|
| `Qwen27b` *(nothink)* | georgeis55/Qwen3.8-27B-mlx-oQ8-fp16-mtp | Universal default: primary code generation | ✅ 2x (1.25x), 4x (2.28x), 8x (3.24x) |
| `Qwen27b:think_low` | georgeis55/Qwen3.8-27B-mlx-oQ8-fp16-mtp | Code generation with light reasoning (harder tasks) | ✅ Single / Batched |
| `Qwen27b:think_high` | georgeis55/Qwen3.8-27B-mlx-oQ8-fp16-mtp | Code generation with high reasoning (task recovery) | ✅ Single / Batched |
| `Coder32b` | mlx-community/Qwen2.5-Coder-32B-Instruct-6bit | Targeted file editing via `omlx_edit`; batched edits via `omlx_batch_chat` | ✅ 2x (1.82x), 4x (3.14x), 8x (3.54x) |
| `Coder3b` | moot20/Qwen2.5-Coder-3B-Instruct-MLX-6bits | Boilerplate: `__init__.py`, configs, docstrings, trivial edits | ✅ 2x (2.04x), 4x (3.39x), 8x (4.43x) |
| `Embed8b` | mlx-community/Qwen3-Embedding-8B-mxfp8 | Semantic search via `omlx_embed` (similarity + vector storage) | ✅ Single / similarity |

### 3.5 Model Selection Guidelines

| Task Type | Model | Tool |
|-----------|-------|------|
| Write a new module from an INTERFACE_CONTRACT | `Qwen27b` (default `nothink`) | `omlx_batch_chat` / `omlx_chat` |
| Moderately difficult module needing algorithmic reasoning | `Qwen27b:think_low` | `omlx_chat` / `omlx_batch_chat` |
| Retry a failed task that requires deep reasoning | `Qwen27b:think_high` | `omlx_chat` |
| Fix a failing test (targeted file edit) | `Coder32b` | `omlx_edit` |
| Fix a failing test in a large file (>400 lines) | `Coder32b` | `omlx_edit` with `line_start`/`line_end` |
| Batch-fix 4+ failing files simultaneously | `Coder32b` | `omlx_batch_chat` (3.14x at 4x) |
| Generate `__init__.py`, configs, `.gitignore`, docstrings | `Coder3b` | `omlx_chat` or `omlx_batch_chat` |
| Parallel boilerplate generation (4+ files) | `Coder3b` | `omlx_batch_chat` (3.39x at 4x, 4.43x at 8x) |
| Find which files relate to a user requirement | `Embed8b` | `omlx_embed` (similarity mode) |
| Compare two code snippets for semantic similarity | `Embed8b` | `omlx_embed` (similarity mode) |
| Build a searchable vector index for a project | `Embed8b` | `omlx_embed` (embed mode + save) |
| Check oMLX backend health before a batch | — | `omlx_status` |

**Windowed editing guardrails** (`omlx_edit` with `line_start`/`line_end`):
- **Only use for files >100 lines.** For smaller files, full-file mode is faster and more reliable — the model has full context and no splice boundary to corrupt.
- **Minimum window: 30 lines.** Very small windows (e.g. 5 lines) give Coder32b too little structure to anchor against. The model tends to include read-only context lines in its output, which then get doubled at the splice point. Widen to at least 30 lines even if the edit only touches 1–2 lines.
- **Avoid boundary edits.** When the target edit is in the first or last 20 lines of the file, prefer full-file mode. The bridge adds 20 lines of context padding on each side — at boundaries, one side has no padding, and the model struggles with one-sided context.
- **Line-count-changing edits need wider windows.** Tasks that add or remove lines (inserting a docstring, deleting a method) are riskier than in-place edits because the model must produce a different number of output lines than it received. Give extra margin — at least 10 lines beyond the direct edit site on each side.

### 3.6 Pre-Configured oMLX Profile Specifications

All model operational parameters (memory pinning, context window size `ctx_window`, max output tokens `max_tokens`, and thinking mode on/off) are **strictly controlled and pre-configured by profiles in oMLX**. MCP calls cannot alter model pinning, context window sizes, max token limits, or thinking state at runtime. The table below outlines the established profile settings across local models:

| Alias / Profile | Canonical Model ID | Profile | Thinking Mode | Max Tokens (`max_tokens`) | Context Window (`ctx_window`) | Usage Role |
|-----------------|--------------------|---------|---------------|---------------------------|--------------------------------|------------|
| `Qwen27b` | `georgeis55/Qwen3.8-27B-mlx-oQ8-fp16-mtp` | `nothink` *(default)* | **OFF** | **32,768** | **131,072** | Universal default for code writing & continuous batching |
| `Qwen27b:think_low` | `georgeis55/Qwen3.8-27B-mlx-oQ8-fp16-mtp` | `think_low` | **ON** *(low budget)* | **32,768** | **131,072** | Slightly harder tasks requiring reasoning |
| `Qwen27b:think_high` | `georgeis55/Qwen3.8-27B-mlx-oQ8-fp16-mtp` | `think_high` | **ON** *(high budget)* | **65,536** | **131,072** | Escalated reasoning for failed tasks |
| `Coder32b` | `mlx-community/Qwen2.5-Coder-32B-Instruct-6bit` | *(default)* | **OFF** | **32,768** | **65,536** | Targeted File Editing |
| `Coder3b` | `moot20/Qwen2.5-Coder-3B-Instruct-MLX-6bits` | *(default)* | **OFF** | **8,192** | **32,768** | Boilerplate & Docstrings |
| `Embed8b` | `mlx-community/Qwen3-Embedding-8B-mxfp8` | *(default)* | **N/A** | **1** | **8,192** | Embeddings & Similarity |

- **Thinking mode**: Governed by the requested profile (`nothink` default vs `think_low` / `think_high` for `Qwen27b`).
- **Model aliases**: Pre-mapped to their canonical IDs by the bridge. Unrecognized aliases pass through directly to the oMLX server.

### 3.7 Embedding Usage Patterns (`omlx_embed`)

The `Embed8b` model (Qwen3-Embedding-8B, 4096-dimensional vectors) runs via the `omlx_embed` tool in two modes: **similarity** (compare two texts, returns a float −1.0 to 1.0) and **embed** (generate and save a vector to a JSON file for later reuse). Embed8b co-loads with any model at ~8 GB — it never competes for KV cache or bandwidth with inference models.

#### When to Use Embeddings

Use `omlx_embed` when the task involves **semantic matching** that keyword search (`grep_search`) cannot handle well:

| Trigger | Action | Mode |
|---------|--------|------|
| User says "where do we handle X?" and grep gives 0 or 50+ hits | Compare the user's description against each candidate file's docstring/first 20 lines | `similarity` |
| Planning a change to an unfamiliar codebase with 10+ modules | Rank all modules by semantic relevance to the user's requirement before reading any | `similarity` |
| User asks "is there already something that does X?" | Compare X's description against existing module summaries to find near-duplicates | `similarity` |
| Building a reusable project index for repeated semantic queries | Embed each module's docstring/summary and save vectors to a `.json` index file | `embed` |
| Verifying test coverage gaps | Compare test file descriptions against implementation file descriptions | `similarity` |

#### Similarity Score Interpretation

- **> 0.85**: Near-duplicate or paraphrase — almost certainly the same concept.
- **0.65–0.85**: Strong semantic relationship — likely the right file/module.
- **0.40–0.65**: Weak relationship — may share a domain but not the specific functionality.
- **< 0.40**: Unrelated — safe to skip.

#### Pattern: Semantic File Discovery

When you need to find the most relevant files for a task across a codebase:

1. Use `list_dir` or `grep_search` to get a candidate list of file paths.
2. For each candidate, read its first ~20 lines (module docstring + imports) using `view_file`.
3. Call `omlx_embed` in similarity mode, comparing the user's requirement against each candidate's docstring.
4. Rank by similarity score; read only the top 3–5 files in full.

This avoids reading every file into Cloud context (violates token conservation) while being more accurate than keyword grep for semantic queries.

#### Pattern: Project Embedding Index

For projects you'll revisit across multiple sessions:

1. Embed each module's docstring or summary using `omlx_embed` in embed mode, saving vectors to `<project>/embeddings/<module_name>.json`.
2. In future sessions, embed the user's new requirement and compare against the saved vectors using cosine similarity (the bridge computes this for you in similarity mode if both texts are provided inline, but for saved vectors you'd load and compare manually).
3. This amortizes the embedding cost — each module is embedded once, not on every query.

#### Do NOT Use Embeddings When

- You know the exact function/class name → use `grep_search` instead.
- The codebase has fewer than 5 files → just read them all.
- The query is a literal string match (error message, variable name) → `grep_search` is faster and exact.

---

## 4. ZERO RE-WRITING RULE (TOKEN CONSERVATION)

- Local sub-agents write code directly to disk via `file_path`.
- **STRICT FORBIDDEN ACTION**: The Cloud model MUST NOT read, re-print, re-summarize, or call native file-writing tools (`write_to_file`, `replace_file_content`) to recreate files that were written by `omlx_chat` or `omlx_batch_chat`.
- **Exception**: Reading the bridge's own diagnostic output (line counts, `⚠️ TRUNCATION SUSPECTED` flags, syntax-check error text) to decide what to feed back to the local model is inspection, not recreation, and does not violate this rule.
- Keep Cloud responses focused purely on orchestrating local tools and reviewing test results.
- **Prefer `omlx_edit` over read-and-paste**: When fixing an existing file, ALWAYS use `omlx_edit` instead of reading the file with `view_file`, pasting its contents into an `omlx_chat` prompt, and specifying a `file_path`. The `omlx_edit` tool reads the file internally, keeping the file contents out of Cloud context entirely.

---

## 5. LOCAL VERIFICATION & SELF-CORRECTION WORKFLOW

### 5.1 Interface Consistency Check (Before Running Any Tests)

After a batch completes — and before invoking pytest — run two grep checks:

**Check 1: Method name drift.** Grep the newly written files for the canonical method names declared in the `INTERFACE_CONTRACT` (§1.1). Example:
```bash
grep -rn "def dump_snapshot|def load_snapshot|def increment_counter|def schedule" async_infra/*.py tests/*.py
```

If any file is missing an expected canonical name (i.e. it implemented a synonym instead), fix that single file with a targeted `omlx_edit` call immediately — don't wait for pytest's `ImportError`/`AttributeError` to surface the same drift later and more expensively.

**Check 2: Inline mock/shadow classes in test files.** Grep test files for `class <ClassName>` where `<ClassName>` is the class under test. Example:
```bash
grep -n "class TaskRunner" bridge_tests/test_task_runner.py
```

If the test file defines its own `class TaskRunner` (or whatever the class under test is), the local model created an inline mock that shadows the real implementation — tests will pass but verify nothing. Fix immediately with `omlx_edit`:
```
omlx_edit(file_path="tests/test_task_runner.py",
          instruction="Remove the inline TaskRunner class definition and instead add 'from task_runner import TaskRunner' at the top. All tests must exercise the real implementation, not a local mock.")
```


### 5.2 Automated Terminal Verification

Immediately after local agents finish writing files to disk (and after the §5.1 check above passes clean), execute automated verification tests in the terminal. Always set PYTHONPATH=. and check for virtual environments:
```bash
PYTHONPATH=. .venv/bin/pytest tests/test_infra.py -v || PYTHONPATH=. python3 -m unittest discover -s tests
```

### 5.3 Self-Correction Feedback Loop (Local-First)

If a test fails or throws an error/traceback:
- **First attempt — route directly to local model WITHOUT Cloud diagnosis.** Use `omlx_edit` with the traceback as the instruction:
  ```
  omlx_edit(file_path="/path/to/failing_module.py",
            instruction="The following pytest output shows test failures. Fix the code to make all tests pass:\n\n{exact_traceback}")
  ```
  For large files (>400 lines), include `line_start` and `line_end` to target the specific function/class that failed.
  This skips Cloud token spend on error analysis entirely.
- **Rewrite threshold & High-Reasoning Escalation**: If the file being fixed is >200 lines AND the fix requires near-total replacement (e.g. wrong framework, wrong structure, or the file is clearly bloated/hallucinated), do NOT use `omlx_edit`. Instead regenerate from scratch via `omlx_chat` with the original task prompt. If the task failed due to complex algorithmic difficulty, dispatch `omlx_chat` with `model: "Qwen27b:think_high"` to apply higher reasoning depth.
- **Second attempt — if the first local fix fails**, the Cloud model reads the new traceback, diagnoses the root cause, and writes a more specific `omlx_edit` instruction (or invokes `Qwen27b:think_high` if architectural re-synthesis is required).
- **Third attempt — Cloud escalation.** If two local fix attempts both fail, the Cloud model directly edits the file per §5.4.
- **Batch self-correction**: If 4+ files need fixing after a test run, dispatch all fix prompts in a single `omlx_batch_chat` call (not sequential `omlx_chat`). Include both the traceback AND relevant INTERFACE_CONTRACT in each fix prompt.
- If the traceback is a `TypeError: ... got an unexpected keyword argument 'args'` (or `'kwargs'`) style error, this is very likely the `*args`/`**kwargs` collision described in §1.1. Fix it in the `INTERFACE_CONTRACT` signature itself (rename to `call_args`/`call_kwargs`), not just at the call site, and redispatch every file that implements or calls that signature so they stay in sync.

### 5.4 Cloud Model Escalation

Step in as the Cloud model to directly edit a file ONLY if:
- Two local fix attempts have failed on the same file.
- The task falls under the §3.4 concurrency carve-out.
- The fix is a trivial syntax or import edit that consumes fewer tokens than an MCP roundtrip.