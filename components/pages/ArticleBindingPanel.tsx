"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import type { ArticlePageBinding } from "@/lib/article-page-bindings/types";
import type { Article } from "@/lib/articles/types";
import { ARTICLE_STATUS_LABELS } from "@/lib/articles/types";
import Link from "../Link";

const BINDING_COLORS = [
  "rgba(46, 125, 110, 0.22)",
  "rgba(180, 110, 40, 0.22)",
  "rgba(70, 100, 150, 0.22)",
  "rgba(140, 70, 90, 0.22)",
  "rgba(90, 120, 60, 0.22)",
];

export function bindingColor(index: number) {
  return BINDING_COLORS[index % BINDING_COLORS.length];
}

function articleLabel(article: Article) {
  return article.title;
}

function articleMatchesQuery(article: Article, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [
    article.title,
    article.kicker ?? "",
    article.byline ?? "",
    article.subtitle ?? "",
    ARTICLE_STATUS_LABELS[article.status],
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

export type NewArticleDraft = {
  title: string;
  kicker?: string;
  byline?: string;
};

export default function ArticleBindingPanel({
  articles,
  bindings,
  articleById,
  sectionId,
  pageId,
  hasSelection,
  pending,
  error,
  onBindArticle,
  onCreateArticle,
  onDeleteBinding,
  onFocusBinding,
}: {
  articles: Article[];
  bindings: ArticlePageBinding[];
  articleById: Map<string, Article>;
  sectionId: string;
  pageId: string;
  hasSelection: boolean;
  pending: boolean;
  error: string | null;
  onBindArticle: (articleId: string) => void;
  onCreateArticle: (draft: NewArticleDraft) => Promise<boolean>;
  onDeleteBinding: (bindingId: string) => void;
  onFocusBinding: (bindingId: string) => void;
}) {
  const pageReturnTo = `/sections/${sectionId}/pages/${pageId}`;
  const [inputValue, setInputValue] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kicker, setKicker] = useState("");
  const [byline, setByline] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const aInSection = a.sectionIdList?.includes(sectionId) ? 0 : 1;
      const bInSection = b.sectionIdList?.includes(sectionId) ? 0 : 1;
      if (aInSection !== bInSection) return aInSection - bInSection;
      return a.title.localeCompare(b.title, "pl");
    });
  }, [articles, sectionId]);

  const filteredArticles = useMemo(
    () => sortedArticles.filter((article) => articleMatchesQuery(article, listQuery)),
    [listQuery, sortedArticles],
  );

  const openCreateDialog = () => {
    if (!hasSelection || pending) return;
    setTitle(listQuery.trim());
    setKicker("");
    setByline("");
    setTitleError(null);
    setDialogOpen(true);
  };

  const closeCreateDialog = () => {
    if (pending) return;
    setDialogOpen(false);
    setTitleError(null);
  };

  const submitCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Tytuł jest wymagany");
      return;
    }
    setTitleError(null);
    const ok = await onCreateArticle({
      title: trimmedTitle,
      kicker: kicker.trim() || undefined,
      byline: byline.trim() || undefined,
    });
    if (!ok) return;
    setDialogOpen(false);
    setInputValue("");
    setListQuery("");
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 320 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Powiąż artykuł
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hasSelection
            ? "Wyszukaj istniejący artykuł albo utwórz nowy i dowiąż do zaznaczonego obszaru."
            : "Zaznacz myszką moduły na stronie, potem wyszukaj artykuł albo utwórz nowy."}
        </Typography>
      </Box>

      {error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : null}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        disabled={!hasSelection || pending}
        onClick={openCreateDialog}
      >
        Nowy artykuł w obszarze
      </Button>

      <Autocomplete
        options={sortedArticles}
        value={null}
        inputValue={inputValue}
        onInputChange={(_event, value, reason) => {
          if (reason === "reset") return;
          setInputValue(value);
          setListQuery(value);
        }}
        onChange={(_event, article) => {
          if (!article) return;
          onBindArticle(article.id);
          if (hasSelection) {
            setInputValue("");
            setListQuery("");
          }
        }}
        getOptionLabel={articleLabel}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(options, state) =>
          options.filter((article) =>
            articleMatchesQuery(article, state.inputValue),
          )
        }
        disabled={pending}
        clearOnBlur={false}
        blurOnSelect
        noOptionsText={
          sortedArticles.length === 0
            ? "Brak artykułów w systemie"
            : "Brak wyników wyszukiwania"
        }
        renderOption={(props, article) => {
          const { key, ...optionProps } = props;
          const inSection = article.sectionIdList?.includes(sectionId);
          return (
            <li key={key} {...optionProps}>
              <Box sx={{ py: 0.25 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {article.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ARTICLE_STATUS_LABELS[article.status]}
                  {article.byline ? ` · ${article.byline}` : ""}
                  {inSection ? " · ten grzbiet" : ""}
                </Typography>
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="Szukaj artykułu"
            placeholder="Tytuł, autor, status…"
            helperText={
              hasSelection
                ? "Wybierz wynik, aby dowiązać do obszaru"
                : "Najpierw zaznacz moduły, potem wybierz artykuł"
            }
          />
        )}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 120,
          overflow: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {sortedArticles.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Brak artykułów. Zaznacz obszar i utwórz nowy artykuł.
            </Typography>
          </Box>
        ) : filteredArticles.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Brak wyników dla „{listQuery.trim()}”.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {filteredArticles.map((article) => (
              <ListItem key={article.id} disablePadding>
                <ListItemButton
                  disabled={!hasSelection || pending}
                  onClick={() => onBindArticle(article.id)}
                  sx={{ alignItems: "flex-start" }}
                >
                  <ListItemText
                    primary={article.title}
                    secondary={`${ARTICLE_STATUS_LABELS[article.status]}${
                      article.byline ? ` · ${article.byline}` : ""
                    }`}
                    slotProps={{
                      primary: {
                        variant: "body2",
                        sx: { fontWeight: 600 },
                      },
                      secondary: { variant: "caption" },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Obszary na stronie ({bindings.length})
        </Typography>
        <Box
          sx={{
            maxHeight: 220,
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          {bindings.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Brak powiązań na tej stronie.
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {bindings.map((binding, index) => {
                const article = articleById.get(binding.articleId);
                const articleTitle = article?.title ?? "Nieznany artykuł";
                return (
                  <ListItem
                    key={binding.id}
                    secondaryAction={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        {article ? (
                          <Tooltip title="Edytuj artykuł">
                            <IconButton
                              component={Link}
                              href={`/articles/${article.id}/edit?returnTo=${encodeURIComponent(pageReturnTo)}`}
                              edge="end"
                              size="small"
                              aria-label={`Edytuj ${articleTitle}`}
                              disabled={pending}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Tooltip title="Usuń powiązanie">
                          <span>
                            <IconButton
                              edge="end"
                              size="small"
                              aria-label={`Usuń powiązanie ${articleTitle}`}
                              disabled={pending}
                              onClick={() => onDeleteBinding(binding.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    }
                    sx={{ pr: article ? 10 : 6 }}
                    disablePadding
                  >
                    <ListItemButton
                      onClick={() => onFocusBinding(binding.id)}
                      disabled={pending}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 0.5,
                          bgcolor: bindingColor(index),
                          border: "1px solid",
                          borderColor: "divider",
                          mr: 1.5,
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      />
                      <ListItemText
                        primary={articleTitle}
                        secondary={`${binding.coordinates.x1.toFixed(1)}, ${binding.coordinates.y1.toFixed(1)} → ${binding.coordinates.x2.toFixed(1)}, ${binding.coordinates.y2.toFixed(1)}`}
                        slotProps={{
                          primary: {
                            variant: "body2",
                            sx: { fontWeight: 600 },
                          },
                          secondary: { variant: "caption" },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={closeCreateDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="new-article-dialog-title"
      >
        <DialogTitle id="new-article-dialog-title">
          Nowy artykuł w zaznaczonym obszarze
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Artykuł zostanie utworzony jako szkic, przypisany do tego grzbietu
              i od razu dowiązany do zaznaczenia.
            </Typography>
            {error && dialogOpen ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : null}
            <TextField
              autoFocus
              label="Tytuł"
              required
              fullWidth
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (titleError) setTitleError(null);
              }}
              error={Boolean(titleError)}
              helperText={titleError}
              disabled={pending}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitCreate();
                }
              }}
            />
            <TextField
              label="Nadtytuł"
              fullWidth
              value={kicker}
              onChange={(event) => setKicker(event.target.value)}
              disabled={pending}
            />
            <TextField
              label="Autor / byline"
              fullWidth
              value={byline}
              onChange={(event) => setByline(event.target.value)}
              disabled={pending}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog} disabled={pending}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitCreate()}
            disabled={pending}
          >
            {pending ? "Tworzenie…" : "Utwórz i dowiąż"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
