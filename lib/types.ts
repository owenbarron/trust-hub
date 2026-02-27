export type AuditStatus = "active" | "closed";

export interface Audit {
  id: string;
  name: string;
  status: AuditStatus;
  period_start: string | null;
  period_end: string | null;
  auditor_firm: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ControlListRow {
  id: string;
  name: string;
  implementation_status: string;
  testing_status: string;
  freshness_date: string | null;
  evidence_count: number;
  criteria_count: number;
}

export interface RequestListRow {
  id: string;
  summary: string;
  status: string;
  assignee: string | null;
  priority: string;
  linked_controls: number;
  evidence_count: number;
  due_date: string | null;
}

export interface PolicyListRow {
  id: number;
  name: string;
  description: string | null;
  review_date: string | null;
  linked_controls: number;
  relationship_types: string;
  file_path: string | null;
}

export interface EvidenceListRow {
  id: number;
  filename: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}
