"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useActionState, useMemo, useState } from "react";
import type { ArticleFormState, Article } from "@/lib/articles/types";
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABELS,
} from "@/lib/articles/types";
import type { Issue } from "@/lib/issues/types";
import type { Magazine } from "@/lib/magazines/types";
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
  magazines: Magazine[];
  issues: Issue[];
  sections: Section[];
  submitLabel: string;
  cancelHref?: string;
  cancelLabel?: string;
  returnTo?: string;
};

export default function ArticleForm({
  action,
  article,
  magazines,
  issues,
  sections,
  submitLabel,
  cancelHref = "/articles",
  cancelLabel = "Anuluj",
  returnTo,
}: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [magazineId, setMagazineId] = useState(article?.magazineId ?? "");
  const [sectionIds, setSectionIds] = useState<string[]>(
    article?.sectionIdList ?? [],
  );
  const [bindingConfirmed, setBindingConfirmed] = useState(Boolean(article));

  const issueById = useMemo(
    () => new Map(issues.map((issue) => [issue.id, issue])),
    [issues],
  );
  const magazineById = useMemo(
    () => new Map(magazines.map((magazine) => [magazine.id, magazine])),
    [magazines],
  );

  const sectionMagazineId = (section: Section) =>
    issueById.get(section.issueId)?.magazineId;

  const availableSections = useMemo(() => {
    if (!magazineId) return sections;
    return sections.filter((section) => {
      const sectionMagId = issueById.get(section.issueId)?.magazineId;
      return sectionMagId === magazineId;
    });
  }, [magazineId, sections, issueById]);

  const bindingError = state.fieldErrors?.binding || state.fieldErrors?.magazineId;
  const hasBinding = Boolean(magazineId || sectionIds.length > 0);

  const sectionLabel = (section: Section) => {
    const magazine = magazineById.get(sectionMagazineId(section) ?? "");
    const magazineName = magazine?.shortName || magazine?.name;
    const code = section.code ? ` (${section.code})` : "";
    return magazineName
      ? `${section.name}${code} · ${magazineName}`
      : `${section.name}${code}`;
  };

  const bindingSummary = (() => {
    const magazine = magazineById.get(magazineId);
    const magazineName = magazine
      ? `${magazine.name}${magazine.shortName ? ` (${magazine.shortName})` : ""}`
      : null;
    const sectionNames = sectionIds
      .map((id) => {
        const section = sections.find((item) => item.id === id);
        return section ? sectionLabel(section) : null;
      })
      .filter(Boolean);
    if (magazineName && sectionNames.length > 0) {
      return `${magazineName} · ${sectionNames.join(", ")}`;
    }
    if (magazineName) return magazineName;
    if (sectionNames.length > 0) return sectionNames.join(", ");
    return "Brak przypisania";
  })();

  const handleMagazineChange = (nextMagazineId: string) => {
    setMagazineId(nextMagazineId);
    if (nextMagazineId) {
      setSectionIds((current) =>
        current.filter((id) => {
          const section = sections.find((item) => item.id === id);
          return section
            ? sectionMagazineId(section) === nextMagazineId
            : false;
        }),
      );
    }
  };

  const handleSectionsChange = (nextIds: string[]) => {
    setSectionIds(nextIds);
    if (!magazineId && nextIds.length > 0) {
      const first = sections.find((section) => section.id === nextIds[0]);
      const derived = first ? sectionMagazineId(first) : undefined;
      if (derived) setMagazineId(derived);
    }
  };

  const bindingFields = (
    showErrors: boolean,
  ) => (
    <>
      <FormControl
        fullWidth
        disabled={pending || magazines.length === 0}
        error={showErrors && Boolean(bindingError) && !hasBinding}
      >
        <InputLabel id="article-magazine-label">Magazyn</InputLabel>
        <Select
          labelId="article-magazine-label"
          label="Magazyn"
          value={magazineId}
          onChange={(event) => handleMagazineChange(String(event.target.value))}
        >
          <MenuItem value="">
            <em>Bez magazynu (wybierz grzbiet)</em>
          </MenuItem>
          {magazines.map((magazine) => (
            <MenuItem key={magazine.id} value={magazine.id}>
              {magazine.name}
              {magazine.shortName ? ` (${magazine.shortName})` : ""}
            </MenuItem>
          ))}
        </Select>
        {magazines.length === 0 ? (
          <FormHelperText>
            Brak magazynów — wybierz grzbiet albo dodaj magazyn.
          </FormHelperText>
        ) : (
          <FormHelperText>
            Wybierz magazyn, aby w edytorze pojawiły się jego style akapitowe.
          </FormHelperText>
        )}
      </FormControl>

      <FormControl
        fullWidth
        disabled={pending || availableSections.length === 0}
        error={showErrors && Boolean(bindingError) && !hasBinding}
      >
        <InputLabel id="article-sections-label">Grzbiety</InputLabel>
        <Select
          labelId="article-sections-label"
          multiple
          value={sectionIds}
          onChange={(event) => {
            const value = event.target.value;
            handleSectionsChange(
              typeof value === "string" ? value.split(",") : value,
            );
          }}
          input={<OutlinedInput label="Grzbiety" />}
          renderValue={(selected) =>
            selected
              .map((id) => {
                const section = sections.find((item) => item.id === id);
                return section ? sectionLabel(section) : id;
              })
              .join(", ")
          }
        >
          {availableSections.map((section) => (
            <MenuItem key={section.id} value={section.id}>
              {sectionLabel(section)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {showErrors && bindingError
            ? bindingError
            : availableSections.length === 0
              ? magazineId
                ? "Brak grzbietów dla wybranego magazynu — wystarczy sam magazyn."
                : "Brak grzbietów — wybierz magazyn."
              : "Opcjonalnie, jeśli przypiszesz magazyn."}
        </FormHelperText>
      </FormControl>
    </>
  );

  if (!article && !bindingConfirmed) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 560 }}
      >
        <Box>
          <Typography variant="h6" component="h2" gutterBottom>
            Przypisz artykuł
          </Typography>
          <Typography color="text.secondary">
            Zanim otworzysz formularz, wybierz magazyn albo grzbiet. Magazyn
            ładuje też style akapitowe edytora.
          </Typography>
        </Box>

        <Alert severity={hasBinding ? "info" : "warning"} sx={{ py: 0.5 }}>
          Wymagany jest magazyn albo przynajmniej jeden grzbiet.
        </Alert>

        {bindingFields(false)}

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            disabled={!hasBinding}
            onClick={() => setBindingConfirmed(true)}
          >
            Dalej do formularza
          </Button>
          <Button component={Link} href={cancelHref} variant="outlined">
            {cancelLabel}
          </Button>
        </Stack>
      </Box>
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
        <Alert severity="success">Artykuł został zapisany.</Alert>
      ) : null}

      {!article ? (
        <Alert
          severity="info"
          sx={{ py: 0.5 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setBindingConfirmed(false)}
              disabled={pending}
            >
              Zmień
            </Button>
          }
        >
          Przypisanie: {bindingSummary}
        </Alert>
      ) : (
        <Alert severity={hasBinding ? "info" : "warning"} sx={{ py: 0.5 }}>
          Przed zapisem przypisz artykuł do magazynu albo do grzbietu. Magazyn
          ładuje też style akapitowe edytora z konfiguracji typografii.
        </Alert>
      )}

      {article ? bindingFields(true) : null}

      <input type="hidden" name="magazineId" value={magazineId} />
      {sectionIds.map((id) => (
        <input key={id} type="hidden" name="sectionIdList" value={id} />
      ))}

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
        magazineId={magazineId}
      />

      <TextField
        name="notes"
        label="Notatki redakcyjne"
        fullWidth
        multiline
        minRows={2}
        defaultValue={article?.notes ?? ""}
        disabled={pending}
      />

      {!article ? (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Zdjęcia będzie można dodać po zapisaniu artykułu.
        </Alert>
      ) : null}

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
