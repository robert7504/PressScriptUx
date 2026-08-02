export const ISSUE_STATUSES = [
  "PLANNED",
  "IN_PRODUCTION",
  "PUBLISHED",
  "CANCELLED",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  PLANNED: "Planowane",
  IN_PRODUCTION: "W produkcji",
  PUBLISHED: "Opublikowane",
  CANCELLED: "Anulowane",
};

export type Issue = {
  id: string;
  magazineId: string;
  issueNumber: number;
  year: number;
  label: string | null;
  volume: number | null;
  coverDate: string | null;
  onSaleDate: string | null;
  pageCount: number | null;
  pageFormat: string | null;
  coverPrice: number | null;
  status: IssueStatus | null;
  title: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IssueCreateInput = {
  magazineId: string;
  issueNumber: number;
  year: number;
  label?: string | null;
  volume?: number | null;
  coverDate?: string | null;
  onSaleDate?: string | null;
  pageCount?: number | null;
  pageFormat?: string | null;
  coverPrice?: number | null;
  status?: IssueStatus | null;
  title?: string | null;
  notes?: string | null;
};

export type IssueUpdateInput = {
  issueNumber: number;
  year: number;
  label?: string | null;
  volume?: number | null;
  coverDate?: string | null;
  onSaleDate?: string | null;
  pageCount?: number | null;
  pageFormat?: string | null;
  coverPrice?: number | null;
  status?: IssueStatus | null;
  title?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type IssueFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    magazineId?: string;
    issueNumber?: string;
    year?: string;
    volume?: string;
    pageCount?: string;
    coverPrice?: string;
    status?: string;
  };
};
