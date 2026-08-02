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
import { deletePageTemplateAction } from "@/app/actions/page-templates";
import { formatDateTime } from "@/lib/formatDate";
import {
  PAGE_TEMPLATE_COLOR_MODE_LABELS,
  PAGE_TEMPLATE_ORIENTATION_LABELS,
  PAGE_TEMPLATE_UNIT_LABELS,
  type PageTemplate,
} from "@/lib/page-templates/types";
import Link from "../Link";

function formatSize(template: PageTemplate) {
  const unit = template.unit
    ? PAGE_TEMPLATE_UNIT_LABELS[template.unit]
    : "";
  return `${template.width} × ${template.height}${unit ? ` ${unit}` : ""}`;
}

export default function PageTemplatesTable({
  templates,
  configurationNames,
  emptyMessage = "Brak wzorców stron. Dodaj pierwszy i dołącz go do konfiguracji.",
  deleteRedirectTo = "/page-templates",
}: {
  templates: PageTemplate[];
  configurationNames: Record<string, string>;
  emptyMessage?: string;
  deleteRedirectTo?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (templates.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const handleDelete = (template: PageTemplate) => {
    const confirmed = window.confirm(
      `Usunąć wzorzec „${template.name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(template.id);
    startTransition(async () => {
      const result = await deletePageTemplateAction(
        template.id,
        template.configurationId,
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
              <TableCell>Konfiguracja</TableCell>
              <TableCell>Rozmiar</TableCell>
              <TableCell>Siatka</TableCell>
              <TableCell>Orientacja</TableCell>
              <TableCell>Kolor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => {
              const deleting = isPending && pendingId === template.id;
              return (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      component={Link}
                      href={`/configurations/${template.configurationId}/edit`}
                      clickable
                      label={
                        configurationNames[template.configurationId] ||
                        template.configurationId.slice(0, 8)
                      }
                    />
                  </TableCell>
                  <TableCell>{formatSize(template)}</TableCell>
                  <TableCell>
                    {template.modulesX} × {template.modulesY}
                  </TableCell>
                  <TableCell>
                    {template.orientation
                      ? PAGE_TEMPLATE_ORIENTATION_LABELS[template.orientation]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {template.colorMode
                      ? PAGE_TEMPLATE_COLOR_MODE_LABELS[template.colorMode]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={template.active ? "Aktywny" : "Nieaktywny"}
                      color={template.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(template.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/page-templates/${template.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${template.name}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${template.name}`}
                        onClick={() => handleDelete(template)}
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
