"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState, useState } from "react";
import type { ArticleFormState, Article } from "@/lib/articles/types";
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABELS,
} from "@/lib/articles/types";
import type { Section } from "@/lib/sections/types";
import Link from "../Link";
import ArticleEditor from "./ArticleEditor";

const initialState: ArticleFormState = {};

type ArticleFormProps = {
  action: (
    prevState: ArticleFormState,
    formData: FormData,
  ) => Promise<ArticleFormState>;
  article?: Article;
  sections: Section[];
  submitLabel: string;
  cancelHref?: string;
  cancelLabel?: string;
  returnTo?: string;
};

export default function ArticleForm({
  action,
  article,
  sections,
  submitLabel,
  cancelHref = "/articles",
  cancelLabel = "Anuluj",
  returnTo,
}: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [sectionIds, setSectionIds] = useState<string[]>(
    article?.sectionIdList ?? [],
  );

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Artykuł został zapisany.</Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="kicker"
          label="Nadtytuł"
          defaultValue={article?.kicker ?? ""}
          fullWidth
          disabled={pending}
        />
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="article-status-label">Status</InputLabel>
          <Select
            labelId="article-status-label"
            name="status"
            label="Status"
            defaultValue={article?.status ?? "DRAFT"}
          >
            {ARTICLE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {ARTICLE_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <TextField
        name="title"
        label="Tytuł"
        required
        fullWidth
        defaultValue={article?.title ?? ""}
        error={Boolean(state.fieldErrors?.title)}
        helperText={state.fieldErrors?.title}
        disabled={pending}
      />

      <TextField
        name="subtitle"
        label="Podtytuł"
        fullWidth
        defaultValue={article?.subtitle ?? ""}
        disabled={pending}
      />

      <TextField
        name="byline"
        label="Autor / byline"
        fullWidth
        defaultValue={article?.byline ?? ""}
        disabled={pending}
      />

      <TextField
        name="lead"
        label="Lead"
        fullWidth
        multiline
        minRows={2}
        defaultValue={article?.lead ?? ""}
        disabled={pending}
      />

      <ArticleEditor
        defaultValue={article?.content ?? ""}
        error={Boolean(state.fieldErrors?.content)}
        helperText={state.fieldErrors?.content}
        disabled={pending}
      />

      {sections.length > 0 ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="article-sections-label">Grzbiety</InputLabel>
          <Select
            labelId="article-sections-label"
            multiple
            value={sectionIds}
            onChange={(event) => {
              const value = event.target.value;
              setSectionIds(
                typeof value === "string" ? value.split(",") : value,
              );
            }}
            input={<OutlinedInput label="Grzbiety" />}
            renderValue={(selected) =>
              selected
                .map(
                  (id) =>
                    sections.find((section) => section.id === id)?.name ?? id,
                )
                .join(", ")
            }
          >
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                {section.name}
                {section.code ? ` (${section.code})` : ""}
              </MenuItem>
            ))}
          </Select>
          {sectionIds.map((id) => (
            <input key={id} type="hidden" name="sectionIdList" value={id} />
          ))}
        </FormControl>
      ) : null}

      <TextField
        name="notes"
        label="Notatki redakcyjne"
        fullWidth
        multiline
        minRows={2}
        defaultValue={article?.notes ?? ""}
        disabled={pending}
      />

      {article ? (
        <input
          type="hidden"
          name="active"
          value={article.active ? "true" : "false"}
        />
      ) : null}

      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
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
          {cancelLabel}
        </Button>
      </Stack>
    </Box>
  );
}
