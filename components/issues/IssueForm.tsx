"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState } from "react";
import {
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  type Issue,
  type IssueFormState,
} from "@/lib/issues/types";
import Link from "../Link";

const initialState: IssueFormState = {};

export type IssueMagazineOption = {
  id: string;
  name: string;
};

type IssueFormProps = {
  action: (
    prevState: IssueFormState,
    formData: FormData,
  ) => Promise<IssueFormState>;
  issue?: Issue;
  magazines: IssueMagazineOption[];
  magazineName?: string | null;
  submitLabel: string;
  cancelHref?: string;
};

export default function IssueForm({
  action,
  issue,
  magazines,
  magazineName,
  submitLabel,
  cancelHref = "/issues",
}: IssueFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Wydanie zostało zapisane.</Alert>
      ) : null}

      {issue ? (
        <TextField
          label="Magazyn"
          fullWidth
          value={magazineName || issue.magazineId}
          disabled
        />
      ) : (
        <FormControl
          fullWidth
          required
          disabled={pending}
          error={Boolean(state.fieldErrors?.magazineId)}
        >
          <InputLabel id="issue-magazine-label">Magazyn</InputLabel>
          <Select
            labelId="issue-magazine-label"
            name="magazineId"
            label="Magazyn"
            defaultValue=""
          >
            {magazines.map((magazine) => (
              <MenuItem key={magazine.id} value={magazine.id}>
                {magazine.name}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.magazineId ? (
            <FormHelperText>{state.fieldErrors.magazineId}</FormHelperText>
          ) : null}
        </FormControl>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="issueNumber"
          label="Numer wydania"
          type="number"
          required
          fullWidth
          defaultValue={
            issue?.issueNumber != null ? String(issue.issueNumber) : ""
          }
          error={Boolean(state.fieldErrors?.issueNumber)}
          helperText={state.fieldErrors?.issueNumber}
          disabled={pending}
          slotProps={{ htmlInput: { step: 1 } }}
        />
        <TextField
          name="year"
          label="Rok"
          type="number"
          required
          fullWidth
          defaultValue={issue?.year != null ? String(issue.year) : ""}
          error={Boolean(state.fieldErrors?.year)}
          helperText={state.fieldErrors?.year}
          disabled={pending}
          slotProps={{ htmlInput: { min: 1900, max: 2100, step: 1 } }}
        />
        <TextField
          name="volume"
          label="Tom"
          type="number"
          fullWidth
          defaultValue={issue?.volume != null ? String(issue.volume) : ""}
          error={Boolean(state.fieldErrors?.volume)}
          helperText={state.fieldErrors?.volume}
          disabled={pending}
          slotProps={{ htmlInput: { step: 1 } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="label"
          label="Etykieta"
          fullWidth
          defaultValue={issue?.label ?? ""}
          disabled={pending}
          placeholder="np. 1/2026"
          slotProps={{ htmlInput: { maxLength: 32 } }}
        />
        <TextField
          name="title"
          label="Tytuł"
          fullWidth
          defaultValue={issue?.title ?? ""}
          disabled={pending}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="coverDate"
          label="Data okładki"
          type="date"
          fullWidth
          defaultValue={issue?.coverDate ?? ""}
          disabled={pending}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          name="onSaleDate"
          label="Data sprzedaży"
          type="date"
          fullWidth
          defaultValue={issue?.onSaleDate ?? ""}
          disabled={pending}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="pageCount"
          label="Liczba stron"
          type="number"
          fullWidth
          defaultValue={
            issue?.pageCount != null ? String(issue.pageCount) : ""
          }
          error={Boolean(state.fieldErrors?.pageCount)}
          helperText={state.fieldErrors?.pageCount}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
        <TextField
          name="pageFormat"
          label="Format strony"
          fullWidth
          defaultValue={issue?.pageFormat ?? ""}
          disabled={pending}
          placeholder="np. A4"
          slotProps={{ htmlInput: { maxLength: 32 } }}
        />
        <TextField
          name="coverPrice"
          label="Cena okładkowa"
          type="number"
          fullWidth
          defaultValue={
            issue?.coverPrice != null ? String(issue.coverPrice) : ""
          }
          error={Boolean(state.fieldErrors?.coverPrice)}
          helperText={state.fieldErrors?.coverPrice}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        />
      </Stack>

      <FormControl
        fullWidth
        disabled={pending}
        error={Boolean(state.fieldErrors?.status)}
      >
        <InputLabel id="issue-status-label">Status wydania</InputLabel>
        <Select
          labelId="issue-status-label"
          name="status"
          label="Status wydania"
          defaultValue={issue?.status ?? ""}
        >
          <MenuItem value="">—</MenuItem>
          {ISSUE_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {ISSUE_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </Select>
        {state.fieldErrors?.status ? (
          <FormHelperText>{state.fieldErrors.status}</FormHelperText>
        ) : null}
      </FormControl>

      <TextField
        name="notes"
        label="Notatki"
        fullWidth
        multiline
        minRows={2}
        defaultValue={issue?.notes ?? ""}
        disabled={pending}
      />

      {issue ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="issue-active-label">Aktywność</InputLabel>
          <Select
            labelId="issue-active-label"
            name="active"
            label="Aktywność"
            defaultValue={issue.active ? "true" : "false"}
          >
            <MenuItem value="true">Aktywne</MenuItem>
            <MenuItem value="false">Nieaktywne</MenuItem>
          </Select>
        </FormControl>
      ) : null}

      <Stack direction="row" spacing={1.5}>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Zapisywanie…" : submitLabel}
        </Button>
        <Button
          component={Link}
          href={cancelHref}
          variant="outlined"
          disabled={pending}
        >
          Anuluj
        </Button>
      </Stack>
    </Box>
  );
}
