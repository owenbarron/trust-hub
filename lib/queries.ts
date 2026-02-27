import { db, parseOwnerName } from "@/lib/db";
import { ControlListRow, EvidenceListRow, PolicyListRow, RequestListRow } from "@/lib/types";

export function getDashboardMetrics(auditId: string) {
  const overview = db()
    .prepare(
      `SELECT
         COUNT(*) AS total_controls,
         SUM(CASE WHEN implementation_status IN ('Completed', 'Effective') THEN 1 ELSE 0 END) AS implementation_done,
         SUM(CASE WHEN testing_status IN ('Completed', 'Effective', 'Submitted to Auditor') THEN 1 ELSE 0 END) AS testing_done,
         SUM(CASE WHEN freshness_date IS NOT NULL AND date(freshness_date) < date('now') THEN 1 ELSE 0 END) AS stale_controls
       FROM control_snapshots
       JOIN controls c ON c.id = control_snapshots.control_id
       WHERE audit_id = ? AND c.type = 'control'`
    )
    .get(auditId) as {
    total_controls: number;
    implementation_done: number;
    testing_done: number;
    stale_controls: number;
  };

  const evidenceCoverage = db()
    .prepare(
      `SELECT COUNT(DISTINCT cs.control_id) AS with_evidence
       FROM control_snapshots cs
       JOIN controls c ON c.id = cs.control_id
       JOIN control_evidence ce
         ON ce.control_id = cs.control_id
        AND ce.audit_id = cs.audit_id
       WHERE cs.audit_id = ? AND c.type = 'control'`
    )
    .get(auditId) as { with_evidence: number };

  const requestStats = db()
    .prepare(
      `SELECT COUNT(*) AS open_requests
       FROM requests
       WHERE audit_id = ?
         AND COALESCE(status, 'Open') NOT IN ('Closed', 'Completed')`
    )
    .get(auditId) as { open_requests: number };

  return {
    totalControls: overview.total_controls ?? 0,
    implementationDone: overview.implementation_done ?? 0,
    testingDone: overview.testing_done ?? 0,
    staleControls: overview.stale_controls ?? 0,
    controlsWithEvidence: evidenceCoverage.with_evidence ?? 0,
    openRequests: requestStats.open_requests ?? 0,
  };
}

export function getDashboardAttentionRows(auditId: string) {
  return db()
    .prepare(
      `SELECT
         cs.control_id,
         cs.name,
         cs.freshness_date,
         COUNT(ce.evidence_id) AS evidence_count,
         cs.implementation_status,
         cs.testing_status
       FROM control_snapshots cs
       JOIN controls c ON c.id = cs.control_id
       LEFT JOIN control_evidence ce
         ON ce.control_id = cs.control_id
        AND ce.audit_id = cs.audit_id
       WHERE cs.audit_id = ? AND c.type = 'control'
       GROUP BY cs.control_id, cs.name, cs.freshness_date, cs.implementation_status, cs.testing_status
       HAVING evidence_count = 0
           OR (cs.freshness_date IS NOT NULL AND date(cs.freshness_date) < date('now'))
       ORDER BY
         CASE WHEN evidence_count = 0 THEN 0 ELSE 1 END,
         cs.freshness_date ASC
       LIMIT 20`
    )
    .all(auditId) as Array<{
    control_id: string;
    name: string;
    freshness_date: string | null;
    evidence_count: number;
    implementation_status: string;
    testing_status: string;
  }>;
}

export function getControlsList(params: {
  auditId: string;
  q?: string;
  implementation?: string;
  testing?: string;
  hasEvidence?: string;
  sort?: string;
}) {
  const filters: string[] = ["cs.audit_id = ?", "c.type = 'control'"];
  const values: Array<string> = [params.auditId];

  if (params.q) {
    filters.push("(c.id LIKE ? OR c.name LIKE ?)");
    values.push(`%${params.q}%`, `%${params.q}%`);
  }
  if (params.implementation) {
    filters.push("cs.implementation_status = ?");
    values.push(params.implementation);
  }
  if (params.testing) {
    filters.push("cs.testing_status = ?");
    values.push(params.testing);
  }

  const orderByMap: Record<string, string> = {
    id: "c.id ASC",
    name: "c.name ASC",
    implementation: "cs.implementation_status ASC, c.id ASC",
    testing: "cs.testing_status ASC, c.id ASC",
    freshness: "cs.freshness_date IS NULL, cs.freshness_date ASC, c.id ASC",
    evidence: "evidence_count DESC, c.id ASC",
    criteria: "criteria_count DESC, c.id ASC",
  };
  const orderBy = orderByMap[params.sort ?? "name"] ?? orderByMap.name;

  const rows = db()
    .prepare(
      `SELECT
         c.id,
         c.name,
         cs.implementation_status,
         cs.testing_status,
         cs.freshness_date,
         COUNT(DISTINCT ce.evidence_id) AS evidence_count,
         COUNT(DISTINCT cc.criteria_id) AS criteria_count
       FROM controls c
       JOIN control_snapshots cs
         ON cs.control_id = c.id
       LEFT JOIN control_evidence ce
         ON ce.control_id = c.id
        AND ce.audit_id = cs.audit_id
       LEFT JOIN control_criteria cc
         ON cc.control_id = c.id
       WHERE ${filters.join(" AND ")}
       GROUP BY c.id, c.name, cs.implementation_status, cs.testing_status, cs.freshness_date
       ORDER BY ${orderBy}`
    )
    .all(...values) as ControlListRow[];

  if (params.hasEvidence === "yes") {
    return rows.filter((row) => row.evidence_count > 0);
  }
  if (params.hasEvidence === "no") {
    return rows.filter((row) => row.evidence_count === 0);
  }

  return rows;
}

export function getControlDetail(controlId: string, auditId: string) {
  const detail = db()
    .prepare(
      `SELECT
         c.id,
         c.name,
         c.description,
         c.domain,
         cs.implementation_status,
         cs.testing_status,
         cs.automation_status,
         cs.owner,
         cs.freshness_date,
         cs.notes
       FROM controls c
       JOIN control_snapshots cs
         ON cs.control_id = c.id
       WHERE c.id = ? AND cs.audit_id = ?`
    )
    .get(controlId, auditId) as
    | {
        id: string;
        name: string;
        description: string | null;
        domain: string | null;
        implementation_status: string;
        testing_status: string;
        automation_status: string;
        owner: string | null;
        freshness_date: string | null;
        notes: string | null;
      }
    | undefined;

  if (!detail) return null;

  const criteria = db()
    .prepare(
      `SELECT c.id, c.name, c.category, c.subcategory
       FROM control_criteria cc
       JOIN criteria c ON c.id = cc.criteria_id
       WHERE cc.control_id = ?
       ORDER BY c.id`
    )
    .all(controlId) as Array<{
    id: string;
    name: string;
    category: string | null;
    subcategory: string | null;
  }>;

  const policies = db()
    .prepare(
      `SELECT p.id, p.name, p.review_date, pc.relationship_type
       FROM policy_controls pc
       JOIN policies p ON p.id = pc.policy_id
       WHERE pc.control_id = ?
       ORDER BY p.name`
    )
    .all(controlId) as Array<{
    id: number;
    name: string;
    review_date: string | null;
    relationship_type: string;
  }>;

  const evidence = db()
    .prepare(
      `SELECT e.id, e.filename, e.file_type, e.uploaded_by, e.uploaded_at, e.file_path
       FROM control_evidence ce
       JOIN evidence e ON e.id = ce.evidence_id
       WHERE ce.control_id = ? AND ce.audit_id = ?
       ORDER BY e.uploaded_at DESC, e.id DESC`
    )
    .all(controlId, auditId) as Array<{
    id: number;
    filename: string;
    file_type: string | null;
    uploaded_by: string | null;
    uploaded_at: string;
    file_path: string;
  }>;

  const requests = db()
    .prepare(
      `SELECT r.id, r.summary, r.status, r.priority, r.assignee
       FROM request_controls rc
       JOIN requests r ON r.id = rc.request_id
       WHERE rc.control_id = ? AND r.audit_id = ?
       ORDER BY r.id`
    )
    .all(controlId, auditId) as Array<{
    id: string;
    summary: string;
    status: string;
    priority: string;
    assignee: string | null;
  }>;

  return {
    ...detail,
    owner_display: parseOwnerName(detail.owner),
    criteria,
    policies,
    evidence,
    requests,
  };
}

export function getRequestsList(params: {
  auditId: string;
  q?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  sort?: string;
}) {
  const filters: string[] = ["r.audit_id = ?"];
  const values: Array<string> = [params.auditId];

  if (params.q) {
    filters.push("(r.id LIKE ? OR r.summary LIKE ?)");
    values.push(`%${params.q}%`, `%${params.q}%`);
  }
  if (params.status) {
    filters.push("r.status = ?");
    values.push(params.status);
  }
  if (params.priority) {
    filters.push("r.priority = ?");
    values.push(params.priority);
  }
  if (params.assignee) {
    filters.push("r.assignee = ?");
    values.push(params.assignee);
  }

  const orderByMap: Record<string, string> = {
    reference: "r.id ASC",
    status: "r.status ASC, r.id ASC",
    priority: "r.priority DESC, r.id ASC",
    assignee: "r.assignee IS NULL, r.assignee ASC, r.id ASC",
    evidence: "evidence_count DESC, r.id ASC",
  };
  const orderBy = orderByMap[params.sort ?? "reference"] ?? orderByMap.reference;

  return db()
    .prepare(
      `SELECT
         r.id,
         r.summary,
         r.status,
         r.assignee,
         r.priority,
         r.due_date,
         COUNT(DISTINCT rc.control_id) AS linked_controls,
         COUNT(DISTINCT re.evidence_id) AS evidence_count
       FROM requests r
       LEFT JOIN request_controls rc ON rc.request_id = r.id
       LEFT JOIN request_evidence re ON re.request_id = r.id
       WHERE ${filters.join(" AND ")}
       GROUP BY r.id, r.summary, r.status, r.assignee, r.priority, r.due_date
       ORDER BY ${orderBy}`
    )
    .all(...values) as RequestListRow[];
}

export function getRequestDetail(requestId: string, auditId: string) {
  const request = db()
    .prepare(
      `SELECT
         id,
         audit_id,
         hyperproof_id,
         summary,
         description,
         status,
         priority,
         assignee,
         source,
         due_date,
         created_at,
         updated_at
       FROM requests
       WHERE id = ? AND audit_id = ?`
    )
    .get(requestId, auditId) as
    | {
        id: string;
        audit_id: string;
        hyperproof_id: string | null;
        summary: string;
        description: string | null;
        status: string;
        priority: string;
        assignee: string | null;
        source: string | null;
        due_date: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!request) return null;

  const controls = db()
    .prepare(
      `SELECT c.id, c.name
       FROM request_controls rc
       JOIN controls c ON c.id = rc.control_id
       WHERE rc.request_id = ?
       ORDER BY c.id`
    )
    .all(requestId) as Array<{ id: string; name: string }>;

  const evidence = db()
    .prepare(
      `SELECT
         e.id,
         e.filename,
         e.file_type,
         e.uploaded_at,
         e.uploaded_by,
         e.file_path
       FROM request_evidence re
       JOIN evidence e ON e.id = re.evidence_id
       WHERE re.request_id = ?
       ORDER BY e.uploaded_at DESC, e.id DESC`
    )
    .all(requestId) as Array<{
    id: number;
    filename: string;
    file_type: string | null;
    uploaded_at: string;
    uploaded_by: string | null;
    file_path: string;
  }>;

  const comments = db()
    .prepare(
      `SELECT id, author, body, visible_to_auditor, created_at
       FROM comments
       WHERE request_id = ?
       ORDER BY created_at ASC, id ASC`
    )
    .all(requestId) as Array<{
    id: number;
    author: string;
    body: string;
    visible_to_auditor: number;
    created_at: string;
  }>;

  return { request, controls, evidence, comments };
}

export function getCriteriaMatrix(params: {
  auditId: string;
  q?: string;
  category?: string;
  coverage?: string;
}) {
  const rows = db()
    .prepare(
      `SELECT
         c.id AS criteria_id,
         c.name AS criteria_name,
         c.category,
         c.subcategory,
         ctl.id AS control_id,
         ctl.name AS control_name,
         cs.implementation_status,
         cs.testing_status,
         CASE WHEN EXISTS (
           SELECT 1
           FROM control_evidence ce
           WHERE ce.control_id = ctl.id
             AND ce.audit_id = ?
         ) THEN 1 ELSE 0 END AS has_evidence
       FROM criteria c
       LEFT JOIN control_criteria cc ON cc.criteria_id = c.id
       LEFT JOIN controls ctl ON ctl.id = cc.control_id
       LEFT JOIN control_snapshots cs
         ON cs.control_id = ctl.id
        AND cs.audit_id = ?
       ORDER BY c.category, c.subcategory, c.id, ctl.id`
    )
    .all(params.auditId, params.auditId) as Array<{
    criteria_id: string;
    criteria_name: string;
    category: string | null;
    subcategory: string | null;
    control_id: string | null;
    control_name: string | null;
    implementation_status: string | null;
    testing_status: string | null;
    has_evidence: number;
  }>;

  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      subcategory: string;
      controls: Array<{
        id: string;
        name: string;
        implementation: string | null;
        testing: string | null;
        hasEvidence: boolean;
      }>;
    }
  >();

  for (const row of rows) {
    const key = row.criteria_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: row.criteria_id,
        name: row.criteria_name,
        category: row.category ?? "Uncategorized",
        subcategory: row.subcategory ?? "General",
        controls: [],
      });
    }
    if (row.control_id && row.control_name) {
      grouped.get(key)!.controls.push({
        id: row.control_id,
        name: row.control_name,
        implementation: row.implementation_status,
        testing: row.testing_status,
        hasEvidence: Boolean(row.has_evidence),
      });
    }
  }

  let criteria = Array.from(grouped.values());

  if (params.q) {
    const search = params.q.toLowerCase();
    criteria = criteria.filter(
      (item) =>
        item.id.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search)
    );
  }

  if (params.category) {
    criteria = criteria.filter((item) => item.category === params.category);
  }

  if (params.coverage === "uncovered") {
    criteria = criteria.filter((item) => item.controls.length === 0);
  }
  if (params.coverage === "partial") {
    criteria = criteria.filter(
      (item) =>
        item.controls.length > 0 &&
        item.controls.some((control) => !control.hasEvidence)
    );
  }
  if (params.coverage === "covered") {
    criteria = criteria.filter(
      (item) => item.controls.length > 0 && item.controls.every((control) => control.hasEvidence)
    );
  }

  const categories = Array.from(new Set(criteria.map((item) => item.category))).sort();

  return { criteria, categories };
}

export function getPoliciesList(params: {
  q?: string;
  relationshipType?: string;
  reviewState?: string;
  sort?: string;
}) {
  const base = db()
    .prepare(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.review_date,
         p.file_path,
         COUNT(pc.control_id) AS linked_controls,
         COALESCE(GROUP_CONCAT(DISTINCT pc.relationship_type), '') AS relationship_types
       FROM policies p
       LEFT JOIN policy_controls pc ON pc.policy_id = p.id
       GROUP BY p.id, p.name, p.description, p.review_date, p.file_path`
    )
    .all() as PolicyListRow[];

  let rows = base;

  if (params.q) {
    const search = params.q.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(search) ||
        (row.description ?? "").toLowerCase().includes(search)
    );
  }

  if (params.relationshipType) {
    rows = rows.filter((row) =>
      row.relationship_types.split(",").includes(params.relationshipType as string)
    );
  }

  if (params.reviewState) {
    const now = new Date();
    rows = rows.filter((row) => {
      if (!row.review_date) return params.reviewState === "none";
      const review = new Date(row.review_date);
      const days = Math.ceil((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (params.reviewState === "past") return days < 0;
      if (params.reviewState === "soon") return days >= 0 && days <= 30;
      if (params.reviewState === "healthy") return days > 30;
      return true;
    });
  }

  const sort = params.sort ?? "review";
  rows.sort((a, b) => {
    if (sort === "controls") return b.linked_controls - a.linked_controls;
    if (sort === "name") return a.name.localeCompare(b.name);
    const ad = a.review_date ? new Date(a.review_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.review_date ? new Date(b.review_date).getTime() : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  });

  return rows;
}

export function getPolicyDetail(policyId: number, auditId: string) {
  const policy = db()
    .prepare(
      `SELECT id, name, description, version, owner, file_path, review_date, created_at, updated_at
       FROM policies
       WHERE id = ?`
    )
    .get(policyId) as
    | {
        id: number;
        name: string;
        description: string | null;
        version: string | null;
        owner: string | null;
        file_path: string | null;
        review_date: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!policy) return null;

  const linkedControls = db()
    .prepare(
      `SELECT
         pc.relationship_type,
         c.id AS control_id,
         c.name AS control_name,
         cs.implementation_status,
         cs.testing_status,
         CASE WHEN EXISTS (
           SELECT 1 FROM control_evidence ce
           WHERE ce.control_id = c.id AND ce.audit_id = ?
         ) THEN 1 ELSE 0 END AS has_evidence,
         CASE WHEN pc.relationship_type = 'requires_acknowledgement' AND EXISTS (
           SELECT 1 FROM control_evidence ce
           WHERE ce.control_id = c.id AND ce.audit_id = ?
         ) THEN 1 ELSE 0 END AS acknowledged
       FROM policy_controls pc
       JOIN controls c ON c.id = pc.control_id
       LEFT JOIN control_snapshots cs
         ON cs.control_id = c.id
        AND cs.audit_id = ?
       WHERE pc.policy_id = ?
       ORDER BY pc.relationship_type, c.id`
    )
    .all(auditId, auditId, auditId, policyId) as Array<{
    relationship_type: string;
    control_id: string;
    control_name: string;
    implementation_status: string | null;
    testing_status: string | null;
    has_evidence: number;
    acknowledged: number;
  }>;

  return {
    policy,
    linkedControls,
  };
}

export function getEvidenceList(params: { auditId: string; q?: string; type?: string }) {
  const values: Array<string> = [params.auditId, params.auditId];
  const where: string[] = [];

  if (params.q) {
    where.push("(e.filename LIKE ? OR e.file_path LIKE ?)");
    values.push(`%${params.q}%`, `%${params.q}%`);
  }

  if (params.type) {
    where.push("e.file_type = ?");
    values.push(params.type);
  }

  const sql = `SELECT
      e.id,
      e.filename,
      e.file_path,
      e.file_type,
      e.file_size,
      e.uploaded_by,
      e.uploaded_at,
      COALESCE(GROUP_CONCAT(DISTINCT c.id), '') AS linked_controls,
      COALESCE(GROUP_CONCAT(DISTINCT r.id), '') AS linked_requests,
      COUNT(DISTINCT ce.control_id) AS control_link_count
    FROM evidence e
    LEFT JOIN control_evidence ce
      ON ce.evidence_id = e.id
     AND ce.audit_id = ?
    LEFT JOIN controls c ON c.id = ce.control_id
    LEFT JOIN request_evidence re ON re.evidence_id = e.id
    LEFT JOIN requests r
      ON r.id = re.request_id
     AND r.audit_id = ?
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY e.id, e.filename, e.file_path, e.file_type, e.file_size, e.uploaded_by, e.uploaded_at
    ORDER BY e.uploaded_at DESC, e.id DESC`;

  const rows = db().prepare(sql).all(...values) as Array<
    EvidenceListRow & {
      linked_controls: string;
      linked_requests: string;
      control_link_count: number;
    }
  >;

  return rows.map((row) => ({
    ...row,
    linkedControls: row.linked_controls ? row.linked_controls.split(",") : [],
    linkedRequests: row.linked_requests ? row.linked_requests.split(",") : [],
    missingControlLinks: row.control_link_count === 0,
  }));
}

export function getAssigneeOptions(auditId: string): string[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT assignee
       FROM requests
       WHERE audit_id = ? AND assignee IS NOT NULL AND assignee <> ''
       ORDER BY assignee`
    )
    .all(auditId) as Array<{ assignee: string }>;

  return rows.map((row) => row.assignee);
}
