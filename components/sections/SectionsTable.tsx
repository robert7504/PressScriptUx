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
import { deleteSectionAction } from "@/app/actions/sections";
import { formatDateTime } from "@/lib/formatDate";
import {
  SECTION_TYPE_LABELS,
  type Section,
  type SectionType,
} from "@/lib/sections/types";
import Link from "../Link";

function formatType(type: SectionType | null) {
  if (!type) return "—";
  return SECTION_TYPE_LABELS[type] ?? type;
}

export default function SectionsTable({
  sections,
  issueLabels,
  emptyMessage = "Brak grzbietów. Dodaj pierwszy i dołącz go do wydania.",
  deleteRedirectTo = "/sections",
}: {
  sections: Section[];
  issueLabels: Record<string, string>;
  emptyMessage?: string;
  deleteRedirectTo?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (sections.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const handleDelete = (section: Section) => {
    const confirmed = window.confirm(
      `Usunąć grzbiet „${section.name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(section.id);
    startTransition(async () => {
      const result = await deleteSectionAction(
        section.id,
        section.issueId,
        deleteRedirectTo,
      );
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
              <TableCell>Nazwa</TableCell>
              <TableCell>Wydanie</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Strony</TableCell>
              <TableCell>Kolejność</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section) => {
              const deleting = isPending && pendingId === section.id;
              return (
                <TableRow key={section.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {section.name}
                    </Typography>
                    {section.code ? (
                      <Typography variant="caption" color="text.secondary">
                        {section.code}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      component={Link}
                      href={`/issues/${section.issueId}/edit`}
                      clickable
                      label={
                        issueLabels[section.issueId] ||
                        section.issueId.slice(0, 8)
                      }
                    />
                  </TableCell>
                  <TableCell>{formatType(section.type)}</TableCell>
                  <TableCell>
                    {section.pageCount != null ? section.pageCount : "—"}
                    {section.startPage != null
                      ? ` (od ${section.startPage})`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {section.sortOrder != null ? section.sortOrder : "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={section.active ? "Aktywny" : "Nieaktywny"}
                      color={section.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(section.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/sections/${section.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${section.name}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${section.name}`}
                        onClick={() => handleDelete(section)}
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
