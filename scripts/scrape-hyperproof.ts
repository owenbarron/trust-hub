#!/usr/bin/env npx tsx
/**
 * Hyperproof Data Export Script
 *
 * Exports all requests/tasks from Hyperproof including their full details,
 * comments, and proof/evidence files.
 *
 * HOW TO GET YOUR CREDENTIALS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. In Hyperproof, go to Settings → Integrations → API (or Settings → API Keys)
 * 2. Create a new API client / service account
 * 3. Copy the Client ID and Client Secret
 *
 * HOW TO RUN
 * ─────────────────────────────────────────────────────────────────────────────
 *   HYPERPROOF_CLIENT_ID=xxx HYPERPROOF_CLIENT_SECRET=yyy npx tsx scripts/scrape-hyperproof.ts
 *
 * OUTPUT
 * ─────────────────────────────────────────────────────────────────────────────
 * seed-data/hyperproof-export/
 *   _summary.json          — list of all tasks with counts
 *   {taskId}.json          — full detail + comments + proof metadata per task
 *   proof/{taskId}/        — downloaded evidence files per task
 */

import fs from "fs";
import path from "path";

const BASE_URL = "https://api.hyperproof.app/v1";
const OUTPUT_DIR = path.join(process.cwd(), "seed-data", "hyperproof-export");
const PROOF_DIR = path.join(OUTPUT_DIR, "proof");

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  console.log("Authenticating...");
  const res = await fetch("https://accounts.hyperproof.app/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Authentication failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { access_token?: string };
  if (!data.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(data)}`);
  }
  console.log("Authenticated.\n");
  return data.access_token;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch(
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} on ${endpoint}: ${body}`);
  }

  return res.json();
}

async function fetchAllPages(
  token: string,
  endpoint: string,
  method: "GET" | "PUT" = "GET",
  body?: object
): Promise<unknown[]> {
  const results: unknown[] = [];
  let offsetToken: string | null = null;

  do {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set("limit", "100");
    if (offsetToken) url.searchParams.set("offset", offsetToken);

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status} on ${endpoint}: ${text}`);
    }

    const data = await res.json() as unknown;

    // Hyperproof may return an array directly or wrap in { items: [] }
    if (Array.isArray(data)) {
      results.push(...data);
      break;
    } else if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const items = (obj.items ?? obj.data ?? []) as unknown[];
      results.push(...items);
      offsetToken = (obj.nextPage ?? obj.offsetToken ?? obj.nextPageToken ?? null) as string | null;
    } else {
      break;
    }
  } while (offsetToken);

  return results;
}

// ── Download a binary file ────────────────────────────────────────────────────

async function downloadFile(
  token: string,
  proofId: string,
  destPath: string
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/proof/${proofId}/contents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.warn(`    Could not download proof/${proofId} (${res.status})`);
    return false;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const clientId = process.env.HYPERPROOF_CLIENT_ID;
  const clientSecret = process.env.HYPERPROOF_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "Error: HYPERPROOF_CLIENT_ID and HYPERPROOF_CLIENT_SECRET must be set.\n" +
      "Usage: HYPERPROOF_CLIENT_ID=xxx HYPERPROOF_CLIENT_SECRET=yyy npx tsx scripts/scrape-hyperproof.ts"
    );
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(PROOF_DIR, { recursive: true });

  const token = await getToken(clientId, clientSecret);

  // ── Fetch all tasks ────────────────────────────────────────────────────────
  console.log("Fetching task list...");
  const tasks = await fetchAllPages(token, "/tasks/filter", "PUT", {});
  console.log(`Found ${tasks.length} tasks.\n`);

  if (tasks.length === 0) {
    console.warn("No tasks returned. Check your credentials and permissions.");
    process.exit(0);
  }

  const summary: object[] = [];
  let totalComments = 0;
  let totalProofFiles = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i] as Record<string, unknown>;
    const taskId = task.id as string;
    const taskName = (task.name ?? task.title ?? taskId) as string;

    console.log(`[${i + 1}/${tasks.length}] ${taskName}`);

    // Full task detail
    let detail: unknown = task;
    try {
      detail = await apiFetch(token, `/tasks/${taskId}`);
    } catch (e) {
      console.warn(`  Could not fetch full detail: ${e}`);
    }

    // Comments
    let comments: unknown[] = [];
    try {
      comments = await fetchAllPages(token, `/tasks/${taskId}/comments`);
      totalComments += comments.length;
      console.log(`  ${comments.length} comment(s)`);
    } catch (e) {
      console.warn(`  Could not fetch comments: ${e}`);
    }

    // Proof metadata
    let proof: unknown[] = [];
    try {
      proof = await fetchAllPages(token, `/tasks/${taskId}/proof`);
      console.log(`  ${proof.length} proof item(s)`);
    } catch (e) {
      console.warn(`  Could not fetch proof: ${e}`);
    }

    // Download proof files
    if (proof.length > 0) {
      const taskProofDir = path.join(PROOF_DIR, taskId);
      fs.mkdirSync(taskProofDir, { recursive: true });

      for (const item of proof) {
        const p = item as Record<string, unknown>;
        const proofId = p.id as string;
        const filename = (p.filename ?? `${proofId}.bin`) as string;
        const destPath = path.join(taskProofDir, filename);

        if (fs.existsSync(destPath)) {
          console.log(`    Skipping (already exists): ${filename}`);
          continue;
        }

        const ok = await downloadFile(token, proofId, destPath);
        if (ok) {
          totalProofFiles++;
          console.log(`    Downloaded: ${filename}`);
        }

        // Small pause between file downloads
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    // Write per-task JSON
    const output = { task: detail, comments, proof };
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${taskId}.json`),
      JSON.stringify(output, null, 2)
    );

    summary.push({
      id: taskId,
      name: taskName,
      status: task.status,
      commentCount: comments.length,
      proofCount: proof.length,
    });

    // Pause between tasks to stay well under any rate limit
    await new Promise((r) => setTimeout(r, 250));
  }

  // Write summary
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "_summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Tasks exported:      ${tasks.length}`);
  console.log(`Comments captured:   ${totalComments}`);
  console.log(`Proof files saved:   ${totalProofFiles}`);
  console.log(`Output directory:    ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message ?? err);
  process.exit(1);
});
