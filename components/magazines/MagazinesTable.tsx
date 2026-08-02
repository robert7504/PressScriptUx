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
import { deleteMagazineAction } from "@/app/actions/magazines";
import { formatDateTime } from "@/lib/formatDate";
import {
  MAGAZINE_FREQUENCY_LABELS,
  type Magazine,
  type MagazineFrequency,
} from "@/lib/magazines/types";
import Link from "../Link";

function formatFrequency(frequency: MagazineFrequency | null) {
  if (!frequency) return "—";
  return MAGAZINE_FREQUENCY_LABELS[frequency] ?? frequency;
}

export default function MagazinesTable({
  magazines,
  publisherNames,
}: {
  magazines: Magazine[];
  publisherNames: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (magazines.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          Brak magazynów. Dodaj pierwszy magazyn, aby zacząć pracę.
        </Typography>
      </Box>
    );
  }

  const handleDelete = (magazine: Magazine) => {
    const confirmed = window.confirm(
      `Usunąć magazyn „${magazine.name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(magazine.id);
    startTransition(async () => {
      const result = await deleteMagazineAction(magazine.id);
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
              <TableCell>Wydawca</TableCell>
              <TableCell>ISSN</TableCell>
              <TableCell>Częstotliwość</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {magazines.map((magazine) => {
              const deleting = isPending && pendingId === magazine.id;
              return (
                <TableRow key={magazine.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {magazine.name}
                    </Typography>
                    {magazine.shortName ? (
                      <Typography variant="caption" color="text.secondary">
                        {magazine.shortName}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {publisherNames[magazine.publisherId] || "—"}
                  </TableCell>
                  <TableCell>{magazine.issn || "—"}</TableCell>
                  <TableCell>{formatFrequency(magazine.frequency)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={magazine.active ? "Aktywny" : "Nieaktywny"}
                      color={magazine.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(magazine.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/magazines/${magazine.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${magazine.name}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${magazine.name}`}
                        onClick={() => handleDelete(magazine)}
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
