"use client";

import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteMagazineImageAction,
  updateMagazineImageAction,
  uploadMagazineImageAction,
} from "@/app/actions/magazine-images";
import {
  imageContentPath,
  type ArticleImage,
} from "@/lib/articles/types";
import type { Magazine } from "@/lib/magazines/types";
import Link from "../Link";
import ImageCropEditor, {
  type ImageCropEditorHandle,
} from "./ImageCropEditor";

type MagazineImagesPanelProps = {
  magazines: Magazine[];
  initialMagazineId?: string;
  initialImages: ArticleImage[];
  initialUnassignedOnly: boolean;
  loadError?: string | null;
};

type EditFormState = {
  title: string;
  description: string;
  modulesX: string;
  modulesY: string;
};

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toEditForm(image: ArticleImage): EditFormState {
  return {
    title: image.title ?? "",
    description: image.description ?? "",
    modulesX: String(image.modulesX ?? 1),
    modulesY: String(image.modulesY ?? 1),
  };
}

function imageMatchesQuery(image: ArticleImage, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [image.title ?? "", image.description ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

export default function MagazineImagesPanel({
  magazines,
  initialMagazineId,
  initialImages,
  initialUnassignedOnly,
  loadError,
}: MagazineImagesPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const cropEditorRef = useRef<ImageCropEditorHandle>(null);
  const [pending, startTransition] = useTransition();
  const [magazineId, setMagazineId] = useState(
    initialMagazineId ?? magazines[0]?.id ?? "",
  );
  const [unassignedOnly, setUnassignedOnly] = useState(initialUnassignedOnly);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modulesX, setModulesX] = useState("1");
  const [modulesY, setModulesY] = useState("1");
  const [editingImage, setEditingImage] = useState<ArticleImage | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setError(loadError ?? null);
  }, [loadError]);

  useEffect(() => {
    if (initialMagazineId) setMagazineId(initialMagazineId);
  }, [initialMagazineId]);

  useEffect(() => {
    setUnassignedOnly(initialUnassignedOnly);
  }, [initialUnassignedOnly]);

  const sortedImages = [...initialImages].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const filteredImages = sortedImages.filter((image) =>
    imageMatchesQuery(image, searchQuery),
  );
  const trimmedSearch = searchQuery.trim();

  const navigate = (nextMagazineId: string, nextUnassignedOnly: boolean) => {
    const params = new URLSearchParams();
    if (nextMagazineId) params.set("magazineId", nextMagazineId);
    params.set("unassignedOnly", nextUnassignedOnly ? "true" : "false");
    router.push(`/images?${params.toString()}`);
  };

  const runAction = (
    action: () => Promise<{ error?: string; success?: boolean }>,
  ) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  useEffect(() => {
    if (!sourceFile) {
      setSourcePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourcePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  const clearPendingFiles = () => {
    setSourceFile(null);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = "";
    }
  };

  const openEditDialog = (image: ArticleImage) => {
    setEditingImage(image);
    setEditForm(toEditForm(image));
    setEditError(null);
    clearPendingFiles();
  };

  const closeEditDialog = () => {
    if (pending) return;
    setEditingImage(null);
    setEditForm(null);
    setEditError(null);
    clearPendingFiles();
  };

  const handleUpload = () => {
    if (!magazineId) {
      setError("Wybierz magazyn.");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Wybierz plik zdjęcia.");
      return;
    }

    const parsedModulesX = Number.parseInt(modulesX, 10);
    const parsedModulesY = Number.parseInt(modulesY, 10);
    if (!Number.isFinite(parsedModulesX) || parsedModulesX < 1) {
      setError("Szerokość w modułach musi być liczbą całkowitą ≥ 1.");
      return;
    }
    if (!Number.isFinite(parsedModulesY) || parsedModulesY < 1) {
      setError("Wysokość w modułach musi być liczbą całkowitą ≥ 1.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("modulesX", String(parsedModulesX));
    formData.append("modulesY", String(parsedModulesY));

    runAction(async () => {
      const result = await uploadMagazineImageAction(magazineId, formData);
      if (result.success && fileInputRef.current) {
        fileInputRef.current.value = "";
        setSelectedName(null);
        setTitle("");
        setDescription("");
        setModulesX("1");
        setModulesY("1");
      }
      return result;
    });
  };

  const handleSaveEdit = () => {
    if (!editingImage || !editForm || !magazineId) return;

    const modulesX = Number.parseInt(editForm.modulesX, 10);
    const modulesY = Number.parseInt(editForm.modulesY, 10);
    if (!Number.isFinite(modulesX) || modulesX < 1) {
      setEditError("Szerokość w modułach musi być liczbą całkowitą ≥ 1.");
      return;
    }
    if (!Number.isFinite(modulesY) || modulesY < 1) {
      setEditError("Wysokość w modułach musi być liczbą całkowitą ≥ 1.");
      return;
    }
    if (editForm.title.trim().length > 512) {
      setEditError("Tytuł może mieć co najwyżej 512 znaków.");
      return;
    }

    setEditError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("modulesX", String(modulesX));
      formData.append("modulesY", String(modulesY));

      try {
        const cropDirty = cropEditorRef.current?.isDirty() ?? false;
        if (cropDirty || sourceFile) {
          const edited = cropDirty
            ? await cropEditorRef.current?.exportFile()
            : null;
          const fileToUpload = edited ?? sourceFile;
          if (!fileToUpload) {
            setEditError("Nie udało się przygotować wykadrowanego zdjęcia.");
            return;
          }
          formData.append("file", fileToUpload);
        }
      } catch (err) {
        setEditError(
          err instanceof Error
            ? err.message
            : "Nie udało się przygotować edycji zdjęcia.",
        );
        return;
      }

      const result = await updateMagazineImageAction(
        magazineId,
        editingImage.id,
        formData,
      );
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setEditingImage(null);
      setEditForm(null);
      clearPendingFiles();
      router.refresh();
    });
  };

  if (magazines.length === 0) {
    return (
      <Alert severity="info">
        Najpierw dodaj magazyn, aby zarządzać pulą zdjęć.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: "center" } }}
      >
        <FormControl sx={{ minWidth: 240 }} size="small">
          <InputLabel id="images-magazine-label">Magazyn</InputLabel>
          <Select
            labelId="images-magazine-label"
            label="Magazyn"
            value={magazineId}
            onChange={(event) => {
              const next = String(event.target.value);
              setMagazineId(next);
              navigate(next, unassignedOnly);
            }}
            disabled={pending}
          >
            {magazines.map((magazine) => (
              <MenuItem key={magazine.id} value={magazine.id}>
                {magazine.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={unassignedOnly}
              onChange={(event) => {
                const next = event.target.checked;
                setUnassignedOnly(next);
                navigate(magazineId, next);
              }}
              disabled={pending || !magazineId}
            />
          }
          label="Tylko nieprzypisane do artykułu"
        />
        <TextField
          label="Szukaj zdjęcia"
          placeholder="Tytuł lub opis…"
          size="small"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          disabled={pending || !magazineId}
          sx={{ minWidth: 220, flex: 1, maxWidth: 360 }}
        />
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          mb: 3,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          maxWidth: 880,
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Dodaj zdjęcie do puli
        </Typography>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" } }}
          >
            <Button variant="outlined" component="label" disabled={pending}>
              Wybierz plik
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedName(file?.name ?? null);
                  setError(null);
                }}
              />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {selectedName ?? "Nie wybrano pliku"}
            </Typography>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={pending || !selectedName || !magazineId}
            >
              {pending ? "Przesyłanie…" : "Prześlij"}
            </Button>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Tytuł (opcjonalnie)"
              fullWidth
              size="small"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={pending}
              slotProps={{ htmlInput: { maxLength: 512 } }}
            />
            <TextField
              label="Opis (opcjonalnie)"
              fullWidth
              size="small"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={pending}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Moduły w poziomie"
              type="number"
              fullWidth
              size="small"
              value={modulesX}
              onChange={(event) => setModulesX(event.target.value)}
              disabled={pending}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
            />
            <TextField
              label="Moduły w pionie"
              type="number"
              fullWidth
              size="small"
              value={modulesY}
              onChange={(event) => setModulesY(event.target.value)}
              disabled={pending}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
            />
          </Stack>
        </Stack>
      </Box>

      {sortedImages.length === 0 ? (
        <Alert severity="info">
          {unassignedOnly
            ? "Brak wolnych zdjęć w puli tego magazynu."
            : "Brak zdjęć w tym magazynie."}
        </Alert>
      ) : filteredImages.length === 0 ? (
        <Alert severity="info">
          Brak wyników dla „{trimmedSearch}”.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {filteredImages.map((image) => {
            const attached = Boolean(image.articleId);
            return (
              <Box
                key={image.id}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  component="img"
                  src={imageContentPath(image)}
                  alt={image.title || image.originalFileName}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    bgcolor: "action.hover",
                  }}
                />
                <Stack spacing={0.5} sx={{ p: 1.25 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    title={image.title || image.originalFileName}
                  >
                    {image.title || image.originalFileName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {image.modulesX} × {image.modulesY} mod.
                    {" · "}
                    {formatBytes(image.sizeBytes)}
                    {attached && image.articleId ? (
                      <>
                        {" · "}
                        <Link href={`/articles/${image.articleId}/edit`}>
                          w artykule
                        </Link>
                      </>
                    ) : (
                      " · w puli"
                    )}
                  </Typography>
                  {image.description ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {image.description}
                    </Typography>
                  ) : null}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    {attached && image.articleId ? (
                      <Tooltip title="Otwórz edycję artykułu">
                        <IconButton
                          component={Link}
                          href={`/articles/${image.articleId}/edit`}
                          size="small"
                          aria-label="Otwórz edycję artykułu"
                        >
                          <ArticleOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    <Tooltip title="Edytuj zdjęcie">
                      <span>
                        <IconButton
                          size="small"
                          disabled={pending}
                          onClick={() => openEditDialog(image)}
                          aria-label="Edytuj zdjęcie"
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        attached
                          ? "Zdjęcie przypisane do artykułu — odłącz je najpierw (usuń z artykułu)"
                          : "Usuń zdjęcie z puli"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={pending || attached}
                          onClick={() =>
                            runAction(() =>
                              deleteMagazineImageAction(magazineId, image.id),
                            )
                          }
                          aria-label="Usuń zdjęcie"
                        >
                          <DeleteOutlinedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog
        open={Boolean(editingImage && editForm)}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="md"
        aria-labelledby="edit-magazine-image-title"
      >
        <DialogTitle id="edit-magazine-image-title">
          Edycja zdjęcia
        </DialogTitle>
        <DialogContent>
          {editForm && editingImage ? (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {sourceFile
                  ? `Nowy plik: ${sourceFile.name}`
                  : editingImage.originalFileName}
              </Typography>
              <ImageCropEditor
                ref={cropEditorRef}
                imageSrc={
                  sourcePreviewUrl ?? imageContentPath(editingImage)
                }
                fileName={
                  sourceFile?.name ?? editingImage.originalFileName
                }
                contentType={
                  sourceFile?.type || editingImage.contentType
                }
                disabled={pending}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { sm: "center" } }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  disabled={pending}
                >
                  Podmień plik
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSourceFile(file);
                      setEditError(null);
                    }}
                  />
                </Button>
                {sourceFile ? (
                  <Button
                    size="small"
                    disabled={pending}
                    onClick={clearPendingFiles}
                  >
                    Anuluj podmianę
                  </Button>
                ) : null}
              </Stack>
              {editError ? (
                <Alert severity="error">{editError}</Alert>
              ) : null}
              <TextField
                autoFocus
                label="Tytuł"
                fullWidth
                value={editForm.title}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, title: event.target.value } : prev,
                  )
                }
                disabled={pending}
                slotProps={{ htmlInput: { maxLength: 512 } }}
              />
              <TextField
                label="Opis"
                fullWidth
                multiline
                minRows={3}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
                disabled={pending}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Moduły w poziomie"
                  type="number"
                  fullWidth
                  value={editForm.modulesX}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, modulesX: event.target.value }
                        : prev,
                    )
                  }
                  disabled={pending}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                />
                <TextField
                  label="Moduły w pionie"
                  type="number"
                  fullWidth
                  value={editForm.modulesY}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, modulesY: event.target.value }
                        : prev,
                    )
                  }
                  disabled={pending}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                />
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={pending}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={pending}
          >
            {pending ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
