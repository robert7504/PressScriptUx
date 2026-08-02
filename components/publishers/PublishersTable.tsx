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
import { deletePublisherAction } from "@/app/actions/publishers";
import { formatDateTime } from "@/lib/formatDate";
import type { Publisher } from "@/lib/publishers/types";
import Link from "../Link";

function formatAddress(publisher: Publisher) {
  const parts = [
    publisher.street,
    [publisher.postalCode, publisher.city].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default function PublishersTable({
  publishers,
}: {
  publishers: Publisher[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (publishers.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          Brak wydawców. Dodaj pierwszego wydawcę, aby zacząć pracę.
        </Typography>
      </Box>
    );
  }

  const handleDelete = (publisher: Publisher) => {
    const confirmed = window.confirm(
      `Usunąć wydawcę „${publisher.name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(publisher.id);
    startTransition(async () => {
      const result = await deletePublisherAction(publisher.id);
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
              <TableCell>NIP</TableCell>
              <TableCell>Kontakt</TableCell>
              <TableCell>Adres</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {publishers.map((publisher) => {
              const deleting = isPending && pendingId === publisher.id;
              return (
                <TableRow key={publisher.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {publisher.name}
                    </Typography>
                    {publisher.shortName ? (
                      <Typography variant="caption" color="text.secondary">
                        {publisher.shortName}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{publisher.taxId || "—"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {publisher.email || "—"}
                    </Typography>
                    {publisher.phone ? (
                      <Typography variant="caption" color="text.secondary">
                        {publisher.phone}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatAddress(publisher)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={publisher.active ? "Aktywny" : "Nieaktywny"}
                      color={publisher.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(publisher.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/publishers/${publisher.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${publisher.name}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${publisher.name}`}
                        onClick={() => handleDelete(publisher)}
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
