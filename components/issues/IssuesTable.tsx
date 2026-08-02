"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";
import { deleteIssueAction } from "@/app/actions/issues";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import {
  ISSUE_STATUS_LABELS,
  type Issue,
  type IssueStatus,
} from "@/lib/issues/types";
import Link from "../Link";

function formatStatus(status: IssueStatus | null) {
  if (!status) return "—";
  return ISSUE_STATUS_LABELS[status] ?? status;
}

function issueLabel(issue: Issue) {
  if (issue.label) return issue.label;
  if (issue.title) return issue.title;
  return `${issue.issueNumber}/${issue.year}`;
}

export default function IssuesTable({
  issues,
  magazineNames,
}: {
  issues: Issue[];
  magazineNames: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (issues.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          Brak wydań. Dodaj pierwsze wydanie, aby zacząć pracę.
        </Typography>
      </Box>
    );
  }

  const handleDelete = (issue: Issue) => {
    const confirmed = window.confirm(
      `Usunąć wydanie „${issueLabel(issue)}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(issue.id);
    startTransition(async () => {
      const result = await deleteIssueAction(issue.id);
      if (result?.error) {
        setError(result.error);
        setPendingId(null);
      }
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : null}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Wydanie</TableCell>
              <TableCell>Magazyn</TableCell>
              <TableCell>Rok</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data sprzedaży</TableCell>
              <TableCell>Aktywność</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map((issue) => {
              const deleting = isPending && pendingId === issue.id;
              return (
                <TableRow key={issue.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {issue.label || `Nr ${issue.issueNumber}`}
                    </Typography>
                    {issue.title ? (
                      <Typography variant="caption" color="text.secondary">
                        {issue.title}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {magazineNames[issue.magazineId] || "—"}
                  </TableCell>
                  <TableCell>{issue.year}</TableCell>
                  <TableCell>{formatStatus(issue.status)}</TableCell>
                  <TableCell>{formatDate(issue.onSaleDate)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={issue.active ? "Aktywne" : "Nieaktywne"}
                      color={issue.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(issue.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/issues/${issue.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${issueLabel(issue)}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${issueLabel(issue)}`}
                        onClick={() => handleDelete(issue)}
                        disabled={deleting}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
