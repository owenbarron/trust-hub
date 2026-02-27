#!/usr/bin/env npx tsx
/**
 * Hyperproof Data Export Script
 *
 * Exports all requests from Hyperproof including details, comments, and
 * proof/evidence files using the internal API with a browser session token.
 *
 * HOW TO GET YOUR SESSION TOKEN
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Open Hyperproof in Chrome and log in
 * 2. Press Cmd+Option+I → Network tab → Fetch/XHR filter
 * 3. Click anywhere in the app to trigger a request
 * 4. Click any network request → Headers → find "Authorization: Bearer eyJ..."
 * 5. Copy the token (everything after "Bearer ")
 * Token typically lasts several hours — run the full scrape in one session.
 *
 * HOW TO RUN
 * ─────────────────────────────────────────────────────────────────────────────
 *   SESSION_TOKEN='eyJ...' npx tsx scripts/scrape-hyperproof.ts
 *
 * OUTPUT
 * ─────────────────────────────────────────────────────────────────────────────
 * seed-data/hyperproof-export/
 *   _summary.json            — all requests with counts
 *   {requestId}.json         — detail + comments + proof metadata per request
 *   proof/{requestId}/       — downloaded evidence files per request
 */

import fs from "fs";
import path from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const ORG_BASE = "https://hyperproof.app/api/organizations/efc71137-7dd2-11f0-83a4-56d9cb821d79";
const PUB_BASE = "https://api.hyperproof.app/v1"; // published API — used for file downloads with OAuth token
const OUTPUT_DIR = path.join(process.cwd(), "seed-data", "hyperproof-export");
const PROOF_DIR = path.join(OUTPUT_DIR, "proof");

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function get(token: string, url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function getAll(token: string, url: string): Promise<unknown[]> {
  const results: unknown[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const sep = url.includes("?") ? "&" : "?";
    const paged = `${url}${sep}page=${page}&pageSize=${pageSize}`;
    const data = await get(token, paged) as unknown;

    const items = Array.isArray(data)
      ? data
      : ((data as Record<string, unknown>).items ?? data) as unknown[];

    if (!Array.isArray(items) || items.length === 0) break;
    results.push(...items);
    if (items.length < pageSize) break;
    page++;
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch("https://accounts.hyperproof.app/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`OAuth failed (${res.status}): ${await res.text()}`);
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token in OAuth response");
  return data.access_token;
}

async function main() {
  const token = process.env.SESSION_TOKEN;
  if (!token) {
    console.error(
      "Error: SESSION_TOKEN is required.\n\n" +
      "How to get it:\n" +
      "  1. Open Hyperproof in Chrome → DevTools (Cmd+Option+I) → Network tab → Fetch/XHR\n" +
      "  2. Click anything in the app\n" +
      "  3. Click a network request → Headers → Authorization: Bearer eyJ...\n" +
      "  4. Copy the token (after 'Bearer ')\n\n" +
      "Then run:\n" +
      "  SESSION_TOKEN='eyJ...' HYPERPROOF_CLIENT_ID=... HYPERPROOF_CLIENT_SECRET=... npm run scrape"
    );
    process.exit(1);
  }

  // OAuth token — used only for proof file downloads via the published API
  let oauthToken: string | null = null;
  const clientId = process.env.HYPERPROOF_CLIENT_ID;
  const clientSecret = process.env.HYPERPROOF_CLIENT_SECRET;
  if (clientId && clientSecret) {
    try {
      oauthToken = await getOAuthToken(clientId, clientSecret);
      console.log("OAuth token acquired for file downloads.");
    } catch (e) {
      console.warn(`Could not get OAuth token — files will be skipped: ${e}`);
    }
  } else {
    console.warn("No HYPERPROOF_CLIENT_ID/SECRET — proof files will not be downloaded.");
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(PROOF_DIR, { recursive: true });

  // ── Fetch all requests ─────────────────────────────────────────────────────
  console.log("Fetching requests...");
  const requests = await getAll(token, `${ORG_BASE}/requests?parentWorkStatus=active`);
  console.log(`Found ${requests.length} requests.\n`);

  if (requests.length === 0) {
    console.warn("No requests found. Check that your SESSION_TOKEN is fresh.");
    process.exit(0);
  }

  // ── Proof probe mode ───────────────────────────────────────────────────────
  if (process.env.PROOF_TEST) {
    const req = requests[0] as Record<string, unknown>;
    const reqId = req.id as string;
    const parentId = req.parentId as string;
    console.log(`\nProbing proof for ${req.reference} (${reqId})`);
    console.log(`parentId: ${parentId}\n`);

    // Try every variation of the proof endpoint
    const probeUrls = [
      `${ORG_BASE}/proof?objectId=${reqId}&objectType=request&parentObjectId=${parentId}&expand=blobFilename&expand=linkUpdatedOn&expand=integrationStatus&expand=stats&expand=type`,
      `${ORG_BASE}/proof?objectId=${reqId}&objectType=request&parentObjectId=${parentId}`,
      `${ORG_BASE}/requests/${reqId}/proof`,
      `${ORG_BASE}/proof?objectId=${reqId}&objectType=workitem&parentObjectId=${parentId}&expand=blobFilename&expand=type`,
    ];
    for (const url of probeUrls) {
      console.log(`Trying: ${url}`);
      try {
        const r = await get(token, url);
        console.log(JSON.stringify(r, null, 2));
      } catch (e) {
        console.log(`  → failed: ${e}`);
      }
    }
    process.exit(0);
  }

  const summary: object[] = [];
  let totalComments = 0;
  let totalProof = 0;
  let totalFiles = 0;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i] as Record<string, unknown>;
    const reqId = req.id as string;
    const reqRef = (req.reference ?? reqId) as string;
    const parentId = req.parentId as string | undefined;

    console.log(`[${i + 1}/${requests.length}] ${reqRef} — ${(req.summary as string ?? "").slice(0, 60)}`);

    // ── Comments ───────────────────────────────────────────────────────────
    let comments: unknown[] = [];
    try {
      comments = await getAll(token, `${ORG_BASE}/requests/${reqId}/comments`);
      totalComments += comments.length;
      if (comments.length > 0) console.log(`  ${comments.length} comment(s)`);
    } catch (e) {
      console.warn(`  Comments failed: ${e}`);
    }

    // ── Proof metadata ─────────────────────────────────────────────────────
    let proof: unknown[] = [];
    if (parentId) {
      try {
        const proofUrl =
          `${ORG_BASE}/proof` +
          `?objectId=${reqId}` +
          `&objectType=request` +
          `&parentObjectId=${parentId}` +
          `&expand=blobFilename&expand=linkUpdatedOn&expand=type`;
        const proofData = await get(token, proofUrl) as unknown;
        proof = Array.isArray(proofData)
          ? proofData
          : ((proofData as Record<string, unknown>).data
              ?? (proofData as Record<string, unknown>).items
              ?? []) as unknown[];
        totalProof += proof.length;
        if (proof.length > 0) console.log(`  ${proof.length} proof item(s)`);
      } catch (e) {
        console.warn(`  Proof failed: ${e}`);
      }
    }

    // ── Download proof files via published API + OAuth token ──────────────
    if (proof.length > 0 && oauthToken) {
      const reqProofDir = path.join(PROOF_DIR, reqId);
      fs.mkdirSync(reqProofDir, { recursive: true });

      for (const item of proof) {
        const p = item as Record<string, unknown>;
        const proofId = p.id as string;
        const filename = (p.filename ?? `${proofId}.bin`) as string;
        const destPath = path.join(reqProofDir, filename);

        // Delete any previously-downloaded HTML stub
        if (fs.existsSync(destPath)) {
          const existing = fs.readFileSync(destPath, { encoding: "utf8", flag: "r" }).slice(0, 15);
          if (existing.includes("<!doctype")) {
            fs.unlinkSync(destPath);
          } else {
            console.log(`    Skipping (exists): ${filename}`);
            continue;
          }
        }

        try {
          const res = await fetch(`${PUB_BASE}/proof/${proofId}/contents`, {
            headers: { Authorization: `Bearer ${oauthToken}` },
          });
          if (res.ok) {
            fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
            totalFiles++;
            console.log(`    Downloaded: ${filename}`);
          } else {
            console.warn(`    Could not download ${filename} (${res.status})`);
          }
        } catch (e) {
          console.warn(`    Download failed for ${filename}: ${e}`);
        }

        await new Promise((r) => setTimeout(r, 150));
      }
    }

    // ── Save JSON ──────────────────────────────────────────────────────────
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${reqId}.json`),
      JSON.stringify({ request: req, comments, proof }, null, 2)
    );

    summary.push({
      id: reqId,
      reference: reqRef,
      key: req.key,
      summary: req.summary,
      status: req.workItemStatus,
      commentCount: comments.length,
      proofCount: proof.length,
    });

    await new Promise((r) => setTimeout(r, 200));
  }

  // ── Write summary ──────────────────────────────────────────────────────────
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "_summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Requests exported:   ${requests.length}`);
  console.log(`Comments captured:   ${totalComments}`);
  console.log(`Proof items found:   ${totalProof}`);
  console.log(`Proof files saved:   ${totalFiles}`);
  console.log(`Output:              ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message ?? err);
  process.exit(1);
});
