"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useActionState, useMemo, useState } from "react";
import {
  PAGE_TEMPLATE_UNIT_LABELS,
  type PageTemplateUnit,
} from "@/lib/page-templates/types";
import type { PagesFromTemplateFormState } from "@/lib/pages/types";

const initialState: PagesFromTemplateFormState = {};

export type LayoutConfigurationOption = {
  id: string;
  name: string;
  sectionCodes: string[];
};

export type PageTemplateOption = {
  id: string;
  name: string;
  slug: string;
  configurationId: string;
  width?: number;
  height?: number;
  unit?: string | null;
};

type PagesFromTemplateFormProps = {
  action: (
    prevState: PagesFromTemplateFormState,
    formData: FormData,
  ) => Promise<PagesFromTemplateFormState>;
  configurations: LayoutConfigurationOption[];
  templates: PageTemplateOption[];
  defaultSectionCode?: string | null;
  defaultStartPage?: number | null;
  defaultPageCount?: number | null;
};

function numberDefault(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

function templateSizeLabel(template: PageTemplateOption) {
  if (template.width == null || template.height == null) return null;
  const unitKey = template.unit as PageTemplateUnit | null | undefined;
  const unit =
    unitKey && unitKey in PAGE_TEMPLATE_UNIT_LABELS
      ? ` ${PAGE_TEMPLATE_UNIT_LABELS[unitKey]}`
      : template.unit
        ? ` ${template.unit}`
        : "";
  return `${template.width} × ${template.height}${unit}`;
}

export default function PagesFromTemplateForm({
  action,
  configurations,
  templates,
  defaultSectionCode,
  defaultStartPage,
}: PagesFromTemplateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [configurationId, setConfigurationId] = useState(
    configurations[0]?.id ?? "",
  );
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    () =>
      templates
        .filter(
          (template) => template.configurationId === (configurations[0]?.id ?? ""),
        )
        .map((template) => template.id),
  );
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const selectedConfiguration = useMemo(
    () => configurations.find((item) => item.id === configurationId) ?? null,
    [configurations, configurationId],
  );

  const availableTemplates = useMemo(
    () =>
      templates.filter(
        (template) => template.configurationId === configurationId,
      ),
    [templates, configurationId],
  );

  const allSelected =
    availableTemplates.length > 0 &&
    selectedTemplateIds.length === availableTemplates.length;
  const someSelected =
    selectedTemplateIds.length > 0 &&
    selectedTemplateIds.length < availableTemplates.length;

  const handleConfigurationChange = (nextId: string) => {
    setConfigurationId(nextId);
    setSelectedTemplateIds(
      templates
        .filter((template) => template.configurationId === nextId)
        .map((template) => template.id),
    );
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedTemplateIds(
      checked ? availableTemplates.map((template) => template.id) : [],
    );
  };

  const handleToggleTemplate = (templateId: string, checked: boolean) => {
    setSelectedTemplateIds((current) => {
      if (checked) {
        return current.includes(templateId)
          ? current
          : [...current, templateId];
      }
      return current.filter((id) => id !== templateId);
    });
  };

  if (configurations.length === 0) {
    return (
      <Alert severity="info">
        Brak aktywnych konfiguracji typu Layout dla magazynu tego wydania.
        Najpierw dodaj konfigurację Layout z wzorcami stron.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">
          Przepisano {state.createdCount ?? 0}{" "}
          {state.createdCount === 1 ? "stronę" : "stron"} z konfiguracji Layout.
        </Alert>
      ) : null}

      <Typography variant="body2" color="text.secondary">
        Wybierz konfigurację Layout i zaznacz wzorce stron do przepisania.
        Zaznaczone wzorce zostaną utworzone jako kolejne strony grzbietu.
      </Typography>

      <FormControl
        fullWidth
        required
        disabled={pending}
        error={Boolean(state.fieldErrors?.configurationId)}
      >
        <InputLabel id="pages-from-template-configuration-label">
          Konfiguracja Layout
        </InputLabel>
        <Select
          labelId="pages-from-template-configuration-label"
          label="Konfiguracja Layout"
          value={configurationId}
          onChange={(event) => handleConfigurationChange(event.target.value)}
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
            "Wybierz konfigurację Layout z wzorcami stron."}
        </FormHelperText>
      </FormControl>

      <Box
        sx={{
          border: 1,
          borderColor: state.fieldErrors?.pageTemplateId
            ? "error.main"
            : "divider",
          borderRadius: 1,
          px: 2,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2">Wzorce stron do przepisania</Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedTemplateIds.length}/{availableTemplates.length}
          </Typography>
        </Box>

        {availableTemplates.length === 0 ? (
          <Alert severity="warning">
            Ta konfiguracja nie ma aktywnych wzorców stron.
          </Alert>
        ) : (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  disabled={pending}
                />
              }
              label="Zaznacz wszystkie"
            />
            <FormGroup sx={{ pl: 1 }}>
              {availableTemplates.map((template) => {
                const size = templateSizeLabel(template);
                return (
                  <FormControlLabel
                    key={template.id}
                    control={
                      <Checkbox
                        checked={selectedTemplateIds.includes(template.id)}
                        onChange={(event) =>
                          handleToggleTemplate(
                            template.id,
                            event.target.checked,
                          )
                        }
                        disabled={pending}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" component="span">
                          {template.name}{" "}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            ({template.slug})
                          </Typography>
                        </Typography>
                        {size ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            sx={{ display: "block" }}
                          >
                            {size}
                          </Typography>
                        ) : null}
                      </Box>
                    }
                  />
                );
              })}
            </FormGroup>
          </>
        )}

        {availableTemplates
          .filter((template) => selectedTemplateIds.includes(template.id))
          .map((template) => (
            <input
              key={template.id}
              type="hidden"
              name="pageTemplateIds"
              value={template.id}
            />
          ))}
        <FormHelperText error={Boolean(state.fieldErrors?.pageTemplateId)}>
          {state.fieldErrors?.pageTemplateId ||
            "Każdy zaznaczony wzorzec tworzy jedną stronę, kolejno od strony początkowej."}
        </FormHelperText>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="sectionCode"
          label="Kod sekcji w layoutcie"
          fullWidth
          defaultValue={defaultSectionCode ?? ""}
          error={Boolean(state.fieldErrors?.sectionCode)}
          helperText={
            state.fieldErrors?.sectionCode ||
            (selectedConfiguration?.sectionCodes.length
              ? `Opcjonalnie. Dostępne w payload: ${selectedConfiguration.sectionCodes.join(", ")}`
              : "Opcjonalnie — dopasowanie do definicji sekcji w payload konfiguracji.")
          }
          disabled={pending}
          slotProps={{ htmlInput: { maxLength: 64 } }}
        />
        <TextField
          name="startPage"
          label="Strona początkowa"
          type="number"
          fullWidth
          defaultValue={numberDefault(defaultStartPage) || "1"}
          error={Boolean(state.fieldErrors?.startPage)}
          helperText={
            state.fieldErrors?.startPage ||
            "Numer pierwszej przepisywanej strony."
          }
          disabled={pending}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
      </Stack>

      <FormControlLabel
        control={
          <Checkbox
            checked={overwriteExisting}
            onChange={(event) => setOverwriteExisting(event.target.checked)}
            disabled={pending}
          />
        }
        label="Nadpisz istniejące strony o tych numerach"
      />
      <input
        type="hidden"
        name="overwriteExisting"
        value={overwriteExisting ? "true" : "false"}
      />

      <Stack direction="row" spacing={1.5}>
        <Button
          type="submit"
          variant="contained"
          disabled={pending || selectedTemplateIds.length === 0}
        >
          {pending
            ? "Przepisywanie…"
            : selectedTemplateIds.length === availableTemplates.length &&
                availableTemplates.length > 0
              ? "Przepisz wszystkie wzorce"
              : `Przepisz zaznaczone (${selectedTemplateIds.length})`}
        </Button>
      </Stack>
    </Box>
  );
}
