import { md5, sha256, bcrypt, argon2id } from "hash-wasm";

self.onmessage = async (e: MessageEvent) => {
  const { algorithm, workload, salt = "$2b$10$N9qo8uLOickgx2ZMRZoMye" } = e.data;

  const testCandidates = workload || [
    "Password123!", "Welcome2026!", "Company2026!", "Summer2026!", "Winter2025!",
    "Spring2026!", "Admin@123", "Finance2026!", "P@ssword2026", "Enterprise2026!"
  ];

  const startTime = performance.now();
  let completed = 0;

  try {
    if (algorithm === "MD5") {
      // Run MD5 batch
      const iterations = 500;
      for (let i = 0; i < iterations; i++) {
        const pwd = testCandidates[i % testCandidates.length];
        await md5(pwd);
        completed++;
      }
      const elapsed = performance.now() - startTime;
      const throughput = Math.round((completed / (elapsed / 1000)));

      self.postMessage({
        type: "RACE_RESULT",
        payload: {
          algorithm: "MD5",
          candidates_tested: completed,
          elapsed_ms: Math.round(elapsed * 10) / 10,
          throughput,
          memory_cost: "0 KB",
          iterations: "1 (Standard Digest)",
          status: "completed",
        },
      });
    } else if (algorithm === "SHA-256") {
      // Run SHA-256 batch
      const iterations = 500;
      for (let i = 0; i < iterations; i++) {
        const pwd = testCandidates[i % testCandidates.length];
        await sha256(pwd);
        completed++;
      }
      const elapsed = performance.now() - startTime;
      const throughput = Math.round((completed / (elapsed / 1000)));

      self.postMessage({
        type: "RACE_RESULT",
        payload: {
          algorithm: "SHA-256",
          candidates_tested: completed,
          elapsed_ms: Math.round(elapsed * 10) / 10,
          throughput,
          memory_cost: "0 KB",
          iterations: "1 (Standard Digest)",
          status: "completed",
        },
      });
    } else if (algorithm === "bcrypt") {
      // Run bcrypt batch (e.g. cost 8-10 for responsive browser measurement)
      const iterations = 6;
      for (let i = 0; i < iterations; i++) {
        const pwd = testCandidates[i % testCandidates.length];
        await bcrypt({
          password: pwd,
          salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
          costFactor: 10,
          outputType: "encoded",
        });
        completed++;
      }
      const elapsed = performance.now() - startTime;
      const throughput = Math.round((completed / (elapsed / 1000)) * 10) / 10;

      self.postMessage({
        type: "RACE_RESULT",
        payload: {
          algorithm: "bcrypt",
          candidates_tested: completed,
          elapsed_ms: Math.round(elapsed * 10) / 10,
          throughput,
          memory_cost: "4 KB",
          iterations: "Cost 10 (1,024 rounds)",
          status: "completed",
        },
      });
    } else if (algorithm === "Argon2id") {
      // Run Argon2id batch (memory hardness 19 MiB or 8 MiB)
      const iterations = 4;
      for (let i = 0; i < iterations; i++) {
        const pwd = testCandidates[i % testCandidates.length];
        await argon2id({
          password: pwd,
          salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
          iterations: 2,
          memorySize: 8192, // 8 MiB memory cost in browser WASM
          parallelism: 1,
          hashLength: 32,
          outputType: "encoded",
        });
        completed++;
      }
      const elapsed = performance.now() - startTime;
      const throughput = Math.round((completed / (elapsed / 1000)) * 10) / 10;

      self.postMessage({
        type: "RACE_RESULT",
        payload: {
          algorithm: "Argon2id",
          candidates_tested: completed,
          elapsed_ms: Math.round(elapsed * 10) / 10,
          throughput,
          memory_cost: "8,192 KB (Memory-Hard)",
          iterations: "t=2, m=8MB, p=1",
          status: "completed",
        },
      });
    }
  } catch (err: any) {
    self.postMessage({
      type: "RACE_ERROR",
      payload: { algorithm, error: err.message },
    });
  }
};
