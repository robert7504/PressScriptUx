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
  PAGE_TEMPLATE_COLOR_MODES,
  PAGE_TEMPLATE_COLOR_MODE_LABELS,
  PAGE_TEMPLATE_ORIENTATIONS,
  PAGE_TEMPLATE_ORIENTATION_LABELS,
  PAGE_TEMPLATE_PAGE_SIDES,
  PAGE_TEMPLATE_PAGE_SIDE_LABELS,
  PAGE_TEMPLATE_UNITS,
  PAGE_TEMPLATE_UNIT_LABELS,
  type PageTemplate,
  type PageTemplateFormState,
} from "@/lib/page-templates/types";
import Link from "../Link";

const initialState: PageTemplateFormState = {};

export type ConfigurationOption = {
  id: string;
  name: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function numberDefault(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

type PageTemplateFormProps = {
  action: (
    prevState: PageTemplateFormState,
    formData: FormData,
  ) => Promise<PageTemplateFormState>;
  template?: PageTemplate;
  configurations: ConfigurationOption[];
  defaultConfigurationId?: string;
  submitLabel: string;
  cancelHref?: string;
  lockConfiguration?: boolean;
};

export default function PageTemplateForm({
  action,
  template,
  configurations,
  defaultConfigurationId,
  submitLabel,
  cancelHref = "/page-templates",
  lockConfiguration = false,
}: PageTemplateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(template));
  const [configurationId, setConfigurationId] = useState(
    template?.configurationId ?? defaultConfigurationId ?? "",
  );

  const configurationLocked =
    lockConfiguration || (!template && Boolean(defaultConfigurationId));

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Wzorzec strony został zapisany.</Alert>
      ) : null}

      <FormControl
        fullWidth
        required
        disabled={pending || configurations.length === 0 || configurationLocked}
        error={Boolean(state.fieldErrors?.configurationId)}
      >
        <InputLabel id="page-template-configuration-label">
          Konfiguracja
        </InputLabel>
        <Select
          labelId="page-template-configuration-label"
          label="Konfiguracja"
          value={configurationId}
          onChange={(event) => setConfigurationId(event.target.value)}
        >
          {configurations.map((configuration) => (
            <MenuItem key={configuration.id} value={configuration.id}>
              {configuration.name}
            </MenuItem>
          ))}
        </Select>
        <input type="hidden" name="configurationId" value={configurationId} />
        <FormHelperText>
          {state.fieldErrors?.configurationId ||
            "Wzorzec może być dołączony tylko do jednej konfiguracji."}
        </FormHelperText>
      </FormControl>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Nazwa"
          required
          fullWidth
          defaultValue={template?.name ?? ""}
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
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.unit)}
        >
          <InputLabel id="page-template-unit-label">Jednostka</InputLabel>
          <Select
            labelId="page-template-unit-label"
            name="unit"
            label="Jednostka"
            defaultValue={template?.unit ?? "MM"}
          >
            {PAGE_TEMPLATE_UNITS.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {PAGE_TEMPLATE_UNIT_LABELS[unit]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.unit ? (
            <FormHelperText>{state.fieldErrors.unit}</FormHelperText>
          ) : null}
        </FormControl>
        <TextField
          name="width"
          label="Szerokość"
          type="number"
          required
          fullWidth
          defaultValue={numberDefault(template?.width)}
          error={Boolean(state.fieldErrors?.width)}
          helperText={state.fieldErrors?.width}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0.0001, step: "any" } }}
        />
        <TextField
          name="height"
          label="Wysokość"
          type="number"
          required
          fullWidth
          defaultValue={numberDefault(template?.height)}
          error={Boolean(state.fieldErrors?.height)}
          helperText={state.fieldErrors?.height}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0.0001, step: "any" } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="modulesX"
          label="Moduły X"
          type="number"
          required
          fullWidth
          defaultValue={numberDefault(template?.modulesX)}
          error={Boolean(state.fieldErrors?.modulesX)}
          helperText={state.fieldErrors?.modulesX}
          disabled={pending}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          name="modulesY"
          label="Moduły Y"
          type="number"
          required
          fullWidth
          defaultValue={numberDefault(template?.modulesY)}
          error={Boolean(state.fieldErrors?.modulesY)}
          helperText={state.fieldErrors?.modulesY}
          disabled={pending}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          name="moduleGapX"
          label="Odstęp modułów X"
          type="number"
          required
          fullWidth
          defaultValue={numberDefault(template?.moduleGapX ?? 0)}
          error={Boolean(state.fieldErrors?.moduleGapX)}
          helperText={state.fieldErrors?.moduleGapX}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <TextField
          name="moduleGapY"
          label="Odstęp modułów Y"
          type="number"
          required
          fullWidth
          defaultValue={numberDefault(template?.moduleGapY ?? 0)}
          error={Boolean(state.fieldErrors?.moduleGapY)}
          helperText={state.fieldErrors?.moduleGapY}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="marginTop"
          label="Margines górny"
          type="number"
          fullWidth
          defaultValue={numberDefault(template?.marginTop)}
          error={Boolean(state.fieldErrors?.marginTop)}
          helperText={state.fieldErrors?.marginTop}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <TextField
          name="marginRight"
          label="Margines prawy"
          type="number"
          fullWidth
          defaultValue={numberDefault(template?.marginRight)}
          error={Boolean(state.fieldErrors?.marginRight)}
          helperText={state.fieldErrors?.marginRight}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <TextField
          name="marginBottom"
          label="Margines dolny"
          type="number"
          fullWidth
          defaultValue={numberDefault(template?.marginBottom)}
          error={Boolean(state.fieldErrors?.marginBottom)}
          helperText={state.fieldErrors?.marginBottom}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <TextField
          name="marginLeft"
          label="Margines lewy"
          type="number"
          fullWidth
          defaultValue={numberDefault(template?.marginLeft)}
          error={Boolean(state.fieldErrors?.marginLeft)}
          helperText={state.fieldErrors?.marginLeft}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="bleed"
          label="Bleed"
          type="number"
          fullWidth
          defaultValue={numberDefault(template?.bleed)}
          error={Boolean(state.fieldErrors?.bleed)}
          helperText={state.fieldErrors?.bleed}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.orientation)}
        >
          <InputLabel id="page-template-orientation-label">
            Orientacja
          </InputLabel>
          <Select
            labelId="page-template-orientation-label"
            name="orientation"
            label="Orientacja"
            defaultValue={template?.orientation ?? "PORTRAIT"}
          >
            <MenuItem value="">
              <em>Brak</em>
            </MenuItem>
            {PAGE_TEMPLATE_ORIENTATIONS.map((orientation) => (
              <MenuItem key={orientation} value={orientation}>
                {PAGE_TEMPLATE_ORIENTATION_LABELS[orientation]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.orientation ? (
            <FormHelperText>{state.fieldErrors.orientation}</FormHelperText>
          ) : null}
        </FormControl>
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.pageSide)}
        >
          <InputLabel id="page-template-page-side-label">Strona</InputLabel>
          <Select
            labelId="page-template-page-side-label"
            name="pageSide"
            label="Strona"
            defaultValue={template?.pageSide ?? "UNSPECIFIED"}
          >
            <MenuItem value="">
              <em>Brak</em>
            </MenuItem>
            {PAGE_TEMPLATE_PAGE_SIDES.map((side) => (
              <MenuItem key={side} value={side}>
                {PAGE_TEMPLATE_PAGE_SIDE_LABELS[side]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.pageSide ? (
            <FormHelperText>{state.fieldErrors.pageSide}</FormHelperText>
          ) : null}
        </FormControl>
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.colorMode)}
        >
          <InputLabel id="page-template-color-mode-label">
            Tryb koloru
          </InputLabel>
          <Select
            labelId="page-template-color-mode-label"
            name="colorMode"
            label="Tryb koloru"
            defaultValue={template?.colorMode ?? "COLOR"}
          >
            <MenuItem value="">
              <em>Brak</em>
            </MenuItem>
            {PAGE_TEMPLATE_COLOR_MODES.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {PAGE_TEMPLATE_COLOR_MODE_LABELS[mode]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.colorMode ? (
            <FormHelperText>{state.fieldErrors.colorMode}</FormHelperText>
          ) : null}
        </FormControl>
      </Stack>

      <TextField
        name="description"
        label="Opis"
        fullWidth
        multiline
        minRows={2}
        defaultValue={template?.description ?? ""}
        disabled={pending}
      />

      <TextField
        name="notes"
        label="Notatki"
        fullWidth
        multiline
        minRows={2}
        defaultValue={template?.notes ?? ""}
        disabled={pending}
      />

      {template ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="page-template-active-label">Status</InputLabel>
          <Select
            labelId="page-template-active-label"
            name="active"
            label="Status"
            defaultValue={template.active ? "true" : "false"}
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
