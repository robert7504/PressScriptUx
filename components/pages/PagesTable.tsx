"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
import { deletePageAction } from "@/app/actions/pages";
import {
  PAGE_COLOR_MODE_LABELS,
  PAGE_ORIENTATION_LABELS,
  PAGE_SIDE_LABELS,
  PAGE_UNIT_LABELS,
  type Page,
} from "@/lib/pages/types";
import Link from "../Link";

function formatSize(page: Page) {
  const unit = page.unit ? PAGE_UNIT_LABELS[page.unit] : "";
  return `${page.width} × ${page.height}${unit ? ` ${unit}` : ""}`;
}

export default function PagesTable({
  pages,
  sectionId,
  issueId,
  emptyMessage = "Brak stron w tym grzbiecie. Przepisz je z konfiguracji Layout.",
}: {
  pages: Page[];
  sectionId: string;
  issueId?: string | null;
  emptyMessage?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (pages.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const handleDelete = (page: Page) => {
    const label = page.name || `nr ${page.pageNumber}`;
    const confirmed = window.confirm(
      `Usunąć stronę „${label}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(page.id);
    startTransition(async () => {
      const result = await deletePageAction(page.id, sectionId, issueId);
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
              <TableCell>Nr</TableCell>
              <TableCell>Nazwa</TableCell>
              <TableCell>Rozmiar</TableCell>
              <TableCell>Siatka</TableCell>
              <TableCell>Strona</TableCell>
              <TableCell>Orientacja</TableCell>
              <TableCell>Kolor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages.map((page) => {
              const deleting = isPending && pendingId === page.id;
              return (
                <TableRow key={page.id} hover>
                  <TableCell>{page.pageNumber}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {page.name || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatSize(page)}</TableCell>
                  <TableCell>
                    {page.modulesX} × {page.modulesY}
                  </TableCell>
                  <TableCell>
                    {page.pageSide ? PAGE_SIDE_LABELS[page.pageSide] : "—"}
                  </TableCell>
                  <TableCell>
                    {page.orientation
                      ? PAGE_ORIENTATION_LABELS[page.orientation]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {page.colorMode
                      ? PAGE_COLOR_MODE_LABELS[page.colorMode]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={page.active ? "Aktywna" : "Nieaktywna"}
                      color={page.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Podgląd">
                      <IconButton
                        component={Link}
                        href={`/sections/${sectionId}/pages/${page.id}`}
                        size="small"
                        aria-label={`Podgląd strony ${page.pageNumber}`}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń stronę ${page.pageNumber}`}
                        onClick={() => handleDelete(page)}
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
