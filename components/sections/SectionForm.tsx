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
import { useActionState, useState } from "react";
import {
  SECTION_TYPES,
  SECTION_TYPE_LABELS,
  type Section,
  type SectionFormState,
} from "@/lib/sections/types";
import Link from "../Link";

const initialState: SectionFormState = {};

export type SectionIssueOption = {
  id: string;
  label: string;
};

type SectionFormProps = {
  action: (
    prevState: SectionFormState,
    formData: FormData,
  ) => Promise<SectionFormState>;
  section?: Section;
  issues: SectionIssueOption[];
  issueLabel?: string | null;
  defaultIssueId?: string;
  submitLabel: string;
  cancelHref?: string;
  lockIssue?: boolean;
};

function numberDefault(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

export default function SectionForm({
  action,
  section,
  issues,
  issueLabel,
  defaultIssueId,
  submitLabel,
  cancelHref = "/sections",
  lockIssue = false,
}: SectionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [issueId, setIssueId] = useState(
    section?.issueId ?? defaultIssueId ?? "",
  );

  const issueLocked =
    Boolean(section) || lockIssue || (!section && Boolean(defaultIssueId));

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Grzbiet został zapisany.</Alert>
      ) : null}

      {section || issueLocked ? (
        <>
          <TextField
            label="Wydanie"
            fullWidth
            value={
              issueLabel ||
              issues.find((item) => item.id === issueId)?.label ||
              issueId
            }
            disabled
          />
          <input type="hidden" name="issueId" value={issueId} />
        </>
      ) : (
        <FormControl
          fullWidth
          required
          disabled={pending || issues.length === 0}
          error={Boolean(state.fieldErrors?.issueId)}
        >
          <InputLabel id="section-issue-label">Wydanie</InputLabel>
          <Select
            labelId="section-issue-label"
            label="Wydanie"
            value={issueId}
            onChange={(event) => setIssueId(event.target.value)}
          >
            {issues.map((issue) => (
              <MenuItem key={issue.id} value={issue.id}>
                {issue.label}
              </MenuItem>
            ))}
          </Select>
          <input type="hidden" name="issueId" value={issueId} />
          <FormHelperText>
            {state.fieldErrors?.issueId ||
              "Grzbiet należy do jednego wydania."}
          </FormHelperText>
        </FormControl>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Nazwa"
          required
          fullWidth
          defaultValue={section?.name ?? ""}
          error={Boolean(state.fieldErrors?.name)}
          helperText={state.fieldErrors?.name}
          disabled={pending}
        />
        <TextField
          name="code"
          label="Kod"
          fullWidth
          defaultValue={section?.code ?? ""}
          error={Boolean(state.fieldErrors?.code)}
          helperText={state.fieldErrors?.code || "Opcjonalny skrót, np. A, B"}
          disabled={pending}
          slotProps={{ htmlInput: { maxLength: 32 } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.type)}
        >
          <InputLabel id="section-type-label">Typ</InputLabel>
          <Select
            labelId="section-type-label"
            name="type"
            label="Typ"
            defaultValue={section?.type ?? ""}
          >
            <MenuItem value="">
              <em>Brak</em>
            </MenuItem>
            {SECTION_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {SECTION_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.type ? (
            <FormHelperText>{state.fieldErrors.type}</FormHelperText>
          ) : null}
        </FormControl>
        <TextField
          name="sortOrder"
          label="Kolejność"
          type="number"
          fullWidth
          defaultValue={numberDefault(section?.sortOrder)}
          error={Boolean(state.fieldErrors?.sortOrder)}
          helperText={state.fieldErrors?.sortOrder}
          disabled={pending}
          slotProps={{ htmlInput: { step: 1 } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="pageCount"
          label="Liczba stron"
          type="number"
          fullWidth
          defaultValue={numberDefault(section?.pageCount)}
          error={Boolean(state.fieldErrors?.pageCount)}
          helperText={state.fieldErrors?.pageCount}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
        <TextField
          name="startPage"
          label="Strona początkowa"
          type="number"
          fullWidth
          defaultValue={numberDefault(section?.startPage)}
          error={Boolean(state.fieldErrors?.startPage)}
          helperText={state.fieldErrors?.startPage}
          disabled={pending}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          name="pageFormat"
          label="Format stron"
          fullWidth
          defaultValue={section?.pageFormat ?? ""}
          disabled={pending}
          placeholder="np. A4"
          slotProps={{ htmlInput: { maxLength: 32 } }}
        />
      </Stack>

      <TextField
        name="notes"
        label="Notatki"
        fullWidth
        multiline
        minRows={2}
        defaultValue={section?.notes ?? ""}
        disabled={pending}
      />

      {section ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="section-active-label">Status</InputLabel>
          <Select
            labelId="section-active-label"
            name="active"
            label="Status"
            defaultValue={section.active ? "true" : "false"}
          >
            <MenuItem value="true">Aktywny</MenuItem>
            <MenuItem value="false">Nieaktywny</MenuItem>
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
