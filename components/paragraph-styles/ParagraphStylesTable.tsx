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
import { deleteParagraphStyleAction } from "@/app/actions/paragraph-styles";
import { formatDateTime } from "@/lib/formatDate";
import {
  PARAGRAPH_STYLE_HTML_TAG_LABELS,
  type ParagraphStyle,
  type ParagraphStyleHtmlTag,
} from "@/lib/paragraph-styles/types";
import Link from "../Link";

function formatHtmlTag(tag: ParagraphStyleHtmlTag) {
  return PARAGRAPH_STYLE_HTML_TAG_LABELS[tag] ?? tag;
}

export default function ParagraphStylesTable({
  styles,
  configurationNames,
  emptyMessage = "Brak stylów akapitowych. Dodaj pierwszy i dołącz go do konfiguracji.",
  deleteRedirectTo = "/paragraph-styles",
}: {
  styles: ParagraphStyle[];
  configurationNames: Record<string, string>;
  emptyMessage?: string;
  deleteRedirectTo?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (styles.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const handleDelete = (style: ParagraphStyle) => {
    const confirmed = window.confirm(
      `Usunąć styl „${style.name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(style.id);
    startTransition(async () => {
      const result = await deleteParagraphStyleAction(
        style.id,
        style.configurationId,
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
              <TableCell>Tag</TableCell>
              <TableCell>CSS</TableCell>
              <TableCell>Font</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {styles.map((style) => {
              const deleting = isPending && pendingId === style.id;
              return (
                <TableRow key={style.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {style.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {style.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      component={Link}
                      href={`/configurations/${style.configurationId}/edit`}
                      clickable
                      label={
                        configurationNames[style.configurationId] ||
                        style.configurationId.slice(0, 8)
                      }
                    />
                  </TableCell>
                  <TableCell>{formatHtmlTag(style.htmlTag)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {style.cssClass}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {style.fontSize}
                    {style.fontFamily ? ` · ${style.fontFamily}` : ""}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={style.active ? "Aktywny" : "Nieaktywny"}
                      color={style.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(style.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/paragraph-styles/${style.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${style.name}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${style.name}`}
                        onClick={() => handleDelete(style)}
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
