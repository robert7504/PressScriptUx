"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState, useState } from "react";
import {
  MAGAZINE_CONFIGURATION_TYPES,
  MAGAZINE_CONFIGURATION_TYPE_LABELS,
  type MagazineConfiguration,
  type MagazineConfigurationFormState,
} from "@/lib/magazine-configurations/types";
import Link from "../Link";

const initialState: MagazineConfigurationFormState = {};

export type MagazineOption = {
  id: string;
  name: string;
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatPayload(payload: Record<string, unknown> | null | undefined) {
  if (!payload || Object.keys(payload).length === 0) return "";
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "";
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

type MagazineConfigurationFormProps = {
  action: (
    prevState: MagazineConfigurationFormState,
    formData: FormData,
  ) => Promise<MagazineConfigurationFormState>;
  configuration?: MagazineConfiguration;
  magazines: MagazineOption[];
  submitLabel: string;
  cancelHref?: string;
};

export default function MagazineConfigurationForm({
  action,
  configuration,
  magazines,
  submitLabel,
  cancelHref = "/configurations",
}: MagazineConfigurationFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedMagazineIds, setSelectedMagazineIds] = useState<string[]>(
    configuration?.magazineIdList ?? [],
  );
  const [slug, setSlug] = useState(configuration?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(configuration));
  const [configurationType, setConfigurationType] = useState(
    configuration?.type ?? "GENERAL",
  );

  const magazineNameById = Object.fromEntries(
    magazines.map((magazine) => [magazine.id, magazine.name]),
  );

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Konfiguracja została zapisana.</Alert>
      ) : null}

      <FormControl
        fullWidth
        required
        disabled={pending || magazines.length === 0}
        error={Boolean(state.fieldErrors?.magazineIdList)}
      >
        <InputLabel id="configuration-magazines-label">Magazyny</InputLabel>
        <Select
          labelId="configuration-magazines-label"
          multiple
          value={selectedMagazineIds}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedMagazineIds(
              typeof value === "string" ? value.split(",") : value,
            );
          }}
          input={<OutlinedInput label="Magazyny" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((id) => (
                <Chip
                  key={id}
                  size="small"
                  label={magazineNameById[id] || id}
                />
              ))}
            </Box>
          )}
        >
          {magazines.map((magazine) => (
            <MenuItem key={magazine.id} value={magazine.id}>
              <Checkbox checked={selectedMagazineIds.includes(magazine.id)} />
              <ListItemText primary={magazine.name} />
            </MenuItem>
          ))}
        </Select>
        {selectedMagazineIds.map((id) => (
          <input key={id} type="hidden" name="magazineIdList" value={id} />
        ))}
        <FormHelperText>
          {state.fieldErrors?.magazineIdList ||
            "Ta sama konfiguracja może być przypisana do wielu magazynów."}
        </FormHelperText>
      </FormControl>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Nazwa"
          required
          fullWidth
          defaultValue={configuration?.name ?? ""}
          error={Boolean(state.fieldErrors?.name)}
          helperText={state.fieldErrors?.name}
          disabled={pending}
          onChange={(event) => {
            if (!slugTouched) {
              setSlug(slugify(event.target.value));
            }
          }}
        />
        <TextField
          name="slug"
          label="Slug"
          required
          fullWidth
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          error={Boolean(state.fieldErrors?.slug)}
          helperText={state.fieldErrors?.slug}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="configuration-type-label">Typ</InputLabel>
          <Select
            labelId="configuration-type-label"
            name="type"
            label="Typ"
            value={configurationType}
            onChange={(event) =>
              setConfigurationType(
                event.target.value as typeof configurationType,
              )
            }
          >
            {MAGAZINE_CONFIGURATION_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {MAGAZINE_CONFIGURATION_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
          {configurationType === "LAYOUT" ? (
            <FormHelperText>
              Layout to konfiguracja wzorców stron — używana przy przepisywaniu
              stron do grzbietu.
            </FormHelperText>
          ) : null}
        </FormControl>
        <TextField
          name="schemaKey"
          label="Klucz schematu"
          fullWidth
          defaultValue={configuration?.schemaKey ?? ""}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="version"
          label="Wersja"
          type="number"
          fullWidth
          defaultValue={
            configuration?.version != null ? String(configuration.version) : "1"
          }
          error={Boolean(state.fieldErrors?.version)}
          helperText={state.fieldErrors?.version}
          disabled={pending}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          name="priority"
          label="Priorytet"
          type="number"
          fullWidth
          defaultValue={
            configuration?.priority != null
              ? String(configuration.priority)
              : "0"
          }
          error={Boolean(state.fieldErrors?.priority)}
          helperText={state.fieldErrors?.priority}
          disabled={pending}
          slotProps={{ htmlInput: { step: 1 } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="validFrom"
          label="Ważna od"
          type="datetime-local"
          fullWidth
          defaultValue={toDateTimeLocal(configuration?.validFrom)}
          error={Boolean(state.fieldErrors?.validFrom)}
          helperText={state.fieldErrors?.validFrom}
          disabled={pending}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          name="validTo"
          label="Ważna do"
          type="datetime-local"
          fullWidth
          defaultValue={toDateTimeLocal(configuration?.validTo)}
          error={Boolean(state.fieldErrors?.validTo)}
          helperText={state.fieldErrors?.validTo}
          disabled={pending}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <TextField
        name="description"
        label="Opis"
        fullWidth
        multiline
        minRows={2}
        defaultValue={configuration?.description ?? ""}
        disabled={pending}
      />

      <TextField
        name="payload"
        label="Payload (JSON)"
        fullWidth
        multiline
        minRows={6}
        defaultValue={formatPayload(configuration?.payload)}
        error={Boolean(state.fieldErrors?.payload)}
        helperText={
          state.fieldErrors?.payload ||
          (configurationType === "LAYOUT"
            ? 'Dla Layout: JSON z tablicą "sections" (sectionCode, pageTemplateSlug, startPage, pageCount, pageList…).'
            : "Opcjonalny obiekt JSON z parametrami konfiguracji.")
        }
        disabled={pending}
        slotProps={{
          htmlInput: { spellCheck: false, style: { fontFamily: "monospace" } },
        }}
      />

      <TextField
        name="notes"
        label="Notatki"
        fullWidth
        multiline
        minRows={2}
        defaultValue={configuration?.notes ?? ""}
        disabled={pending}
      />

      {configuration ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="configuration-active-label">Status</InputLabel>
          <Select
            labelId="configuration-active-label"
            name="active"
            label="Status"
            defaultValue={configuration.active ? "true" : "false"}
          >
            <MenuItem value="true">Aktywna</MenuItem>
            <MenuItem value="false">Nieaktywna</MenuItem>
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
