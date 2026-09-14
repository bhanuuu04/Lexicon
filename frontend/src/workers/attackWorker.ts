import { md4, md5, sha256 } from "hash-wasm";
import { generateCandidateStream } from "../lib/mutationEngine";

let isCancelled = false;

function toUtf16LE(str: string): Uint8Array {
  const buf = new Uint8Array(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    buf[i * 2] = code & 0xff;
    buf[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return buf;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "CANCEL") {
    isCancelled = true;
    return;
  }

  if (type === "START_ATTACK") {
    isCancelled = false;
    const {
      account_id,
      username,
      department,
      target_hash,
      algorithm = "NTLM",
      max_candidates = 50000,
      time_budget_ms = 30000,
    } = payload;

    const startTime = performance.now();
    let candidatesTested = 0;
    let lastProgressTime = startTime;
    let matched = false;
    let matchedPassword = "";
    let matchedRule = "";

    // Extract seed keywords from username and department
    const contextSeeds = [
      ...username.split(/[\._\-0-9]/).filter((s: string) => s.length >= 3),
      ...department.split(/\s+/).filter((s: string) => s.length >= 3),
    ];

    const stream = generateCandidateStream(contextSeeds, max_candidates);

    const algoLower = algorithm.toLowerCase().replace("-", "").replace("_", "");

    let lastCandidateTested = "";

    for (const item of stream) {
      if (isCancelled) {
        self.postMessage({
          type: "CANCELLED",
          payload: { account_id, candidates_tested: candidatesTested, elapsed_ms: performance.now() - startTime },
        });
        return;
      }

      candidatesTested++;
      const cand = item.candidate;
      lastCandidateTested = cand;
      let computedHash = "";

      if (algoLower === "ntlm") {
        computedHash = await md4(toUtf16LE(cand));
      } else if (algoLower === "md5") {
        computedHash = await md5(cand);
      } else if (algoLower === "sha256") {
        computedHash = await sha256(cand);
      } else {
        computedHash = await md5(cand);
      }


      if (computedHash.toLowerCase() === target_hash.toLowerCase()) {
        matched = true;
        matchedPassword = cand;
        matchedRule = item.rule;
        break;
      }

      const now = performance.now();
      const elapsed = now - startTime;

      // Time budget check
      if (elapsed >= time_budget_ms) {
        break;
      }

      // Throttle UI progress messages to every ~80ms
      if (now - lastProgressTime > 80) {
        lastProgressTime = now;
        const rate = Math.round((candidatesTested / (elapsed / 1000)));
        self.postMessage({
          type: "PROGRESS",
          payload: {
            candidates_tested: candidatesTested,
            elapsed_ms: Math.round(elapsed),
            current_rate: rate,
            current_candidate: cand,
            matched: false,
            status: "RUNNING",
          },
        });
      }
    }

    const totalElapsed = performance.now() - startTime;
    const finalRate = Math.round((candidatesTested / (totalElapsed / 1000)) || 0);

    self.postMessage({
      type: "RESULT",
      payload: {
        account_id,
        algorithm,
        candidates_tested: candidatesTested,
        elapsed_ms: Math.round(totalElapsed * 10) / 10,
        current_rate: finalRate,
        matched,
        matched_password: matched ? matchedPassword : null,
        matched_rule: matched ? matchedRule : null,
        last_candidate: matched ? matchedPassword : lastCandidateTested,
        time_budget_ms,
        status: matched ? "MATCHED" : "BUDGET_EXHAUSTED",
      },
    });
  }
};
