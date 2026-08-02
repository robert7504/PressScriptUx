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
  PARAGRAPH_STYLE_FONT_WEIGHTS,
  PARAGRAPH_STYLE_FONT_WEIGHT_LABELS,
  PARAGRAPH_STYLE_HTML_TAGS,
  PARAGRAPH_STYLE_HTML_TAG_LABELS,
  PARAGRAPH_STYLE_TEXT_ALIGNS,
  PARAGRAPH_STYLE_TEXT_ALIGN_LABELS,
  type ParagraphStyle,
  type ParagraphStyleFormState,
} from "@/lib/paragraph-styles/types";
import Link from "../Link";

const initialState: ParagraphStyleFormState = {};

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

type ParagraphStyleFormProps = {
  action: (
    prevState: ParagraphStyleFormState,
    formData: FormData,
  ) => Promise<ParagraphStyleFormState>;
  style?: ParagraphStyle;
  configurations: ConfigurationOption[];
  defaultConfigurationId?: string;
  submitLabel: string;
  cancelHref?: string;
  lockConfiguration?: boolean;
};

export default function ParagraphStyleForm({
  action,
  style,
  configurations,
  defaultConfigurationId,
  submitLabel,
  cancelHref = "/paragraph-styles",
  lockConfiguration = false,
}: ParagraphStyleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [slug, setSlug] = useState(style?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(style));
  const [configurationId, setConfigurationId] = useState(
    style?.configurationId ?? defaultConfigurationId ?? "",
  );

  const configurationLocked =
    lockConfiguration || (!style && Boolean(defaultConfigurationId));

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Styl akapitowy został zapisany.</Alert>
      ) : null}

      <FormControl
        fullWidth
        required
        disabled={pending || configurations.length === 0 || configurationLocked}
        error={Boolean(state.fieldErrors?.configurationId)}
      >
        <InputLabel id="paragraph-style-configuration-label">
          Konfiguracja
        </InputLabel>
        <Select
          labelId="paragraph-style-configuration-label"
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
            "Styl może być dołączony tylko do jednej konfiguracji."}
        </FormHelperText>
      </FormControl>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Nazwa"
          required
          fullWidth
          defaultValue={style?.name ?? ""}
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
          required
          disabled={pending}
          error={Boolean(state.fieldErrors?.htmlTag)}
        >
          <InputLabel id="paragraph-style-html-tag-label">Tag HTML</InputLabel>
          <Select
            labelId="paragraph-style-html-tag-label"
            name="htmlTag"
            label="Tag HTML"
            defaultValue={style?.htmlTag ?? "P"}
          >
            {PARAGRAPH_STYLE_HTML_TAGS.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {PARAGRAPH_STYLE_HTML_TAG_LABELS[tag]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.htmlTag ? (
            <FormHelperText>{state.fieldErrors.htmlTag}</FormHelperText>
          ) : null}
        </FormControl>
        <TextField
          name="cssClass"
          label="Klasa CSS"
          required
          fullWidth
          defaultValue={style?.cssClass ?? ""}
          error={Boolean(state.fieldErrors?.cssClass)}
          helperText={state.fieldErrors?.cssClass}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="indesignStyleName"
          label="Nazwa stylu InDesign"
          required
          fullWidth
          defaultValue={style?.indesignStyleName ?? ""}
          error={Boolean(state.fieldErrors?.indesignStyleName)}
          helperText={state.fieldErrors?.indesignStyleName}
          disabled={pending}
        />
        <TextField
          name="charactersPerModule"
          label="Znaki na moduł"
          type="number"
          required
          fullWidth
          defaultValue={
            style?.charactersPerModule != null
              ? String(style.charactersPerModule)
              : ""
          }
          error={Boolean(state.fieldErrors?.charactersPerModule)}
          helperText={state.fieldErrors?.charactersPerModule}
          disabled={pending}
          slotProps={{ htmlInput: { step: 1 } }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="fontSize"
          label="Rozmiar fontu"
          type="number"
          required
          fullWidth
          defaultValue={style?.fontSize != null ? String(style.fontSize) : ""}
          error={Boolean(state.fieldErrors?.fontSize)}
          helperText={state.fieldErrors?.fontSize}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0.0001, step: "any" } }}
        />
        <TextField
          name="fontFamily"
          label="Rodzina fontu"
          fullWidth
          defaultValue={style?.fontFamily ?? ""}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.fontWeight)}
        >
          <InputLabel id="paragraph-style-font-weight-label">
            Grubość fontu
          </InputLabel>
          <Select
            labelId="paragraph-style-font-weight-label"
            name="fontWeight"
            label="Grubość fontu"
            defaultValue={style?.fontWeight ?? ""}
          >
            <MenuItem value="">
              <em>Brak</em>
            </MenuItem>
            {PARAGRAPH_STYLE_FONT_WEIGHTS.map((weight) => (
              <MenuItem key={weight} value={weight}>
                {PARAGRAPH_STYLE_FONT_WEIGHT_LABELS[weight]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.fontWeight ? (
            <FormHelperText>{state.fieldErrors.fontWeight}</FormHelperText>
          ) : null}
        </FormControl>
        <FormControl
          fullWidth
          disabled={pending}
          error={Boolean(state.fieldErrors?.textAlign)}
        >
          <InputLabel id="paragraph-style-text-align-label">
            Wyrównanie
          </InputLabel>
          <Select
            labelId="paragraph-style-text-align-label"
            name="textAlign"
            label="Wyrównanie"
            defaultValue={style?.textAlign ?? ""}
          >
            <MenuItem value="">
              <em>Brak</em>
            </MenuItem>
            {PARAGRAPH_STYLE_TEXT_ALIGNS.map((align) => (
              <MenuItem key={align} value={align}>
                {PARAGRAPH_STYLE_TEXT_ALIGN_LABELS[align]}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.textAlign ? (
            <FormHelperText>{state.fieldErrors.textAlign}</FormHelperText>
          ) : null}
        </FormControl>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="lineHeight"
          label="Interlinia"
          type="number"
          fullWidth
          defaultValue={
            style?.lineHeight != null ? String(style.lineHeight) : ""
          }
          error={Boolean(state.fieldErrors?.lineHeight)}
          helperText={state.fieldErrors?.lineHeight}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <TextField
          name="color"
          label="Kolor"
          fullWidth
          defaultValue={style?.color ?? ""}
          disabled={pending}
          placeholder="#000000"
        />
        <TextField
          name="sortOrder"
          label="Kolejność"
          type="number"
          fullWidth
          defaultValue={
            style?.sortOrder != null ? String(style.sortOrder) : "0"
          }
          error={Boolean(state.fieldErrors?.sortOrder)}
          helperText={state.fieldErrors?.sortOrder}
          disabled={pending}
          slotProps={{ htmlInput: { step: 1 } }}
        />
      </Stack>

      <TextField
        name="description"
        label="Opis"
        fullWidth
        multiline
        minRows={2}
        defaultValue={style?.description ?? ""}
        disabled={pending}
      />

      {style ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="paragraph-style-active-label">Status</InputLabel>
          <Select
            labelId="paragraph-style-active-label"
            name="active"
            label="Status"
            defaultValue={style.active ? "true" : "false"}
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
