# Kiro rate-throttle diagnosis and recovery gate

> **Later evidence, 2026-11-01 01:59 UTC:** one post-cooldown request responded without a new throttle hint. Its getter source change passed independent probes, but the new tests have three TypeScript errors and remain unaccepted. Read [the latest verification checkpoint](POST_COOLDOWN_GETTER_REVIEW.md) first; the older status below is historical, not an instruction to repeat the prior recovery attempt.

Original Codex non-inference investigation, **2026-11-01 01:07 UTC**. This updates the earlier unknown-cause report in [UI repair review](UI_REPAIR_REVIEW.md). No application files were changed and no model prompt was submitted during this diagnostic.

## Finding and evidence limits

The retained official CLI logs expose a **service credit-consumption rate throttle**, despite remaining monthly FREE allowance. The native terminal had not displayed this error. Sanitized local log observations:

| UTC event | Observed fields |
|---|---|
| 00:41:01, 00:42:27, 00:47:33, 00:48:31; retained UI session | `q-client-retry.retry-after-hint.applied`; upstream `rawHintMs` approximately 3,594,800–3,595,000; CLI `clampedDelay: 300000`. |
| 00:51:38.039; fresh Auto session | `Failed to stream response chunks (inputSize=2815, historyMessages=0)`; HTTP **429**; `ThrottlingException`; reason **`CREDIT_CONSUMPTION_RATE_EXCEEDED`**; `retryAfterMilliseconds: 3600000`. |
| 00:51:38.041; same fresh session | `llm.invokeTitleModel.error`; `ClientThrottleError`; HTTP 429. This identifies the fully detailed exception as the title-model helper request. |
| 00:51:43.411; authoring turn in the fresh session | `q-client-retry.retry-after-hint.applied`; `rawHintMs: 3594729`, `clampedDelay: 300000`, source `smithy-hint`. |
| 00:55:09–00:55:10; same fresh session | Explicit cancellation, aborted execution, then `kas.server.signal_shutdown` with SIGTERM. |

The detailed 429 belongs to the title helper; the surrounding authoring turns log long retry hints without the same full exception payload. Together they make service throttling/backoff the strongest supported explanation for the apparent no-output waits. Do not claim every request's exact response body was captured, a known account-wide threshold, or a fixed reset schedule. The underlying enforcement policy remains unknown. This is **not monthly quota exhaustion**, and selecting Auto did not remove the observed throttle.

The latest hint ends at approximately **2026-11-01 01:51:38 UTC**. Use **01:52 UTC or later** as the earliest bounded retry gate based on this evidence, not a guaranteed release time. New responses may require a later wait. No inference was attempted during this investigation.

## Non-inference environment and account checks

- Managed instance is running/connected with current observations; restricted network policy is enforced with the seven previously approved Kiro hosts. No network/security configuration was changed.
- Workspace filesystem: about **29 GiB available**, 4% used, 1% inode use. `/tmp`: about **8.8 GiB available**. Cgroup memory: about **0.92 GiB of 16 GiB**; OOM/max events zero. Load averages were `0.00 0.00 0.01`; PID limit events zero. No resource-exhaustion evidence was found.
- Final process-name check found **no live Kiro, Node, script or Vite process**; port 5173 had no listener. There are **38 defunct processes adopted by PID 1** (Node/esbuild/Git/Chromium/Codex/npm). They are already terminated, not running writers; no attempt was made to restart PID 1 or the environment merely to reap them. No evidence links these small zombie counts to the service 429.
- Official `kiro-cli --version`: **2.37.0**. Native `whoami` exited 0 and indicated Builder ID at **01:06 UTC**; identity output was suppressed.
- One new empty native session ran only `/usage`, then `/quit`: **KIRO FREE 25.35/50**, reset **2026-12-01**, observed **01:06 UTC**. It exited 0. Its log has shutdown but no prompt/LLM/generation/stream-response event among the inspected event names. No model prompt or tool approval was sent.
- Logs also contain a cloud-configuration manifest HTTP 403 and telemetry DNS failures. Both occurred before successful domain/UI writing too. They are not established causes of this throttle. No direct manifest/telemetry probe, extra host grant or alternate route was used; the empty observer startup can repeat its native background checks. Telemetry was not enabled or rerouted.

Only safe event names, timestamps, error codes and resource measurements are retained here. Raw logs, request identifiers, authenticated transcripts and account identifiers remain outside Git. Credential databases and secret values were not inspected.

## Preservation

Independent local review confirmed all nine UI source files match their existing archive members byte-for-byte. Archive SHA-256 remains `011ad468e4e68fab22f225ce4cba44d807ca1caa38010c75d780513c23ca438c`, size 14,223 bytes, mode 0600. `ActionForm.tsx` is absent. The nine-file UI stays local and unaccepted. [UI repair review](UI_REPAIR_REVIEW.md) retains its real failed checks and recovery directions.

The accepted sibling remains clean at `d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a`. Reviewed domain source `3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59` and all earlier handoff commits are preserved. No app tests were rerun for this documentation-only diagnosis.

## Smallest recovery action

**No user purchase, upgrade, billing change, re-login, new network grant or credential transfer is indicated.** The immediate action is to respect the provider's wait hint. The supervising agent may resume the already-authorized work after the gate; this document creates no timer or automatic background job.

1. At or after **01:52 UTC on November 1**, check that no writer is active and verify current FREE entitlement with native `/usage`.
2. Make **one** bounded official native request on the existing narrow ActionForm scope, with scoped tool approvals, while watching safe log event names. This later cooldown expiry is materially new evidence; do not repeat the earlier requests before it.
3. If a new throttle/retry hint appears, cancel that attempt promptly, close the client, record the new timestamp/hint and pause again. Do not wait through repeated internal five-minute retries, cycle models, or buy capacity.
4. If writing responds, keep one writer and a small scope; proceed through the [ordered UI repair gates](UI_REPAIR_REVIEW.md). Inspect current allowance between scopes and slow further work when a service rate hint appears. Do not infer a safe fixed credits-per-hour rate from this single observation.
5. If throttling persists beyond the observed wait, report the exact sanitized error to the supervising thread. Any support contact remains a separate user-authorized action; do not send logs or account details externally on your own.

All product work remains paused until that recovery check. Kiro remains the primary application coder; no Codex replacement implementation is authorized by this diagnosis.
