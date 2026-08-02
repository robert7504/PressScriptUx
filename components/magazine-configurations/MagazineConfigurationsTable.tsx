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
import { deleteMagazineConfigurationAction } from "@/app/actions/magazine-configurations";
import { formatDateTime } from "@/lib/formatDate";
import {
  MAGAZINE_CONFIGURATION_TYPE_LABELS,
  type MagazineConfiguration,
  type MagazineConfigurationType,
} from "@/lib/magazine-configurations/types";
import Link from "../Link";

function formatType(type: MagazineConfigurationType | null) {
  if (!type) return "—";
  return MAGAZINE_CONFIGURATION_TYPE_LABELS[type] ?? type;
}

export default function MagazineConfigurationsTable({
  configurations,
  magazineNames,
}: {
  configurations: MagazineConfiguration[];
  magazineNames: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (configurations.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          Brak konfiguracji. Dodaj pierwszą, aby powiązać ją z magazynami.
        </Typography>
      </Box>
    );
  }

  const handleDelete = (configuration: MagazineConfiguration) => {
    const confirmed = window.confirm(
      `Usunąć konfigurację „${configuration.name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(configuration.id);
    startTransition(async () => {
      const result = await deleteMagazineConfigurationAction(configuration.id);
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
              <TableCell>Typ</TableCell>
              <TableCell>Magazyny</TableCell>
              <TableCell>Wersja</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zaktualizowano</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configurations.map((configuration) => {
              const deleting = isPending && pendingId === configuration.id;
              const magazineIds = configuration.magazineIdList ?? [];
              return (
                <TableRow key={configuration.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {configuration.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {configuration.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatType(configuration.type)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {magazineIds.length > 0 ? (
                        magazineIds.map((magazineId) => (
                          <Chip
                            key={magazineId}
                            size="small"
                            label={
                              magazineNames[magazineId] ||
                              magazineId.slice(0, 8)
                            }
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{configuration.version ?? "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={configuration.active ? "Aktywna" : "Nieaktywna"}
                      color={configuration.active ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(configuration.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edytuj">
                      <IconButton
                        component={Link}
                        href={`/configurations/${configuration.id}/edit`}
                        size="small"
                        aria-label={`Edytuj ${configuration.name}`}
                        disabled={deleting}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Usuń ${configuration.name}`}
                        onClick={() => handleDelete(configuration)}
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
