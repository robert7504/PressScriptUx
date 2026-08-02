"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  attachArticleImagesAction,
  deleteArticleImageAction,
  setMainArticleImageAction,
  updateArticleImageAction,
  uploadArticleImageAction,
} from "@/app/actions/article-images";
import {
  imageContentPath,
  type ArticleImage,
} from "@/lib/articles/types";
import ImageCropEditor, {
  type ImageCropEditorHandle,
} from "../images/ImageCropEditor";
import Link from "../Link";

type ArticleImagesPanelProps = {
  articleId: string;
  magazineId: string;
  images: ArticleImage[];
  poolImages: ArticleImage[];
  poolError?: string | null;
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

export default function ArticleImagesPanel({
  articleId,
  magazineId,
  images,
  poolImages,
  poolError,
}: ArticleImagesPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const cropEditorRef = useRef<ImageCropEditorHandle>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [asMain, setAsMain] = useState(images.length === 0);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ArticleImage | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(
    null,
  );
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);
  const [attachAsMain, setAttachAsMain] = useState(images.length === 0);
  const [attachError, setAttachError] = useState<string | null>(null);

  const sortedImages = [...images].sort((a, b) => {
    if (a.main !== b.main) return a.main ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  const availablePool = poolImages.filter(
    (image) => !images.some((attached) => attached.id === image.id),
  );

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

  const openAttachDialog = () => {
    setSelectedPoolIds([]);
    setAttachAsMain(images.length === 0);
    setAttachError(poolError ?? null);
    setAttachOpen(true);
  };

  const closeAttachDialog = () => {
    if (pending) return;
    setAttachOpen(false);
    setSelectedPoolIds([]);
    setAttachError(null);
  };

  const togglePoolImage = (imageId: string) => {
    setSelectedPoolIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId],
    );
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Wybierz plik zdjęcia.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("main", asMain ? "true" : "false");

    runAction(async () => {
      const result = await uploadArticleImageAction(articleId, formData);
      if (result.success && fileInputRef.current) {
        fileInputRef.current.value = "";
        setSelectedName(null);
        setAsMain(false);
      }
      return result;
    });
  };

  const handleAttach = () => {
    if (selectedPoolIds.length === 0) {
      setAttachError("Wybierz co najmniej jedno zdjęcie z puli.");
      return;
    }

    setAttachError(null);
    startTransition(async () => {
      const result = await attachArticleImagesAction(
        articleId,
        selectedPoolIds,
        { main: attachAsMain },
      );
      if (result.error) {
        setAttachError(result.error);
        return;
      }
      setAttachOpen(false);
      setSelectedPoolIds([]);
      router.refresh();
    });
  };

  const handleSaveEdit = () => {
    if (!editingImage || !editForm) return;

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

      const result = await updateArticleImageAction(
        articleId,
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

  return (
    <Box
      sx={{
        mt: 4,
        pt: 3,
        borderTop: 1,
        borderColor: "divider",
        maxWidth: 880,
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Zdjęcia artykułu
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Prześlij nowe zdjęcie albo dołącz wcześniej dodane z{" "}
        <Link href={`/images?magazineId=${magazineId}`}>puli magazynu</Link>.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2.5, alignItems: { sm: "center" }, flexWrap: "wrap" }}
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
        <FormControlLabel
          control={
            <Checkbox
              checked={asMain}
              onChange={(event) => setAsMain(event.target.checked)}
              disabled={pending}
            />
          }
          label="Ustaw jako główne"
        />
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={pending || !selectedName}
        >
          {pending ? "Przesyłanie…" : "Prześlij"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<LinkOutlinedIcon />}
          onClick={openAttachDialog}
          disabled={pending}
        >
          Dołącz z puli
        </Button>
      </Stack>

      {sortedImages.length === 0 ? (
        <Alert severity="info">
          Brak zdjęć — prześlij nowe albo dołącz z puli magazynu.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {sortedImages.map((image) => (
            <Box
              key={image.id}
              sx={{
                border: 1,
                borderColor: image.main ? "primary.main" : "divider",
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
                  {image.main ? " · główne" : ""}
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
                      image.main
                        ? "Zdjęcie główne"
                        : "Oznacz jako główne"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        color={image.main ? "primary" : "default"}
                        disabled={pending || image.main}
                        onClick={() =>
                          runAction(() =>
                            setMainArticleImageAction(articleId, image.id),
                          )
                        }
                        aria-label={
                          image.main
                            ? "Zdjęcie główne"
                            : "Oznacz jako główne"
                        }
                      >
                        {image.main ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Usuń zdjęcie">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={pending}
                        onClick={() =>
                          runAction(() =>
                            deleteArticleImageAction(articleId, image.id),
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
          ))}
        </Box>
      )}

      <Dialog
        open={attachOpen}
        onClose={closeAttachDialog}
        fullWidth
        maxWidth="md"
        aria-labelledby="attach-article-images-title"
      >
        <DialogTitle id="attach-article-images-title">
          Dołącz zdjęcia z puli magazynu
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {attachError ? (
              <Alert severity="error">{attachError}</Alert>
            ) : null}
            {availablePool.length === 0 ? (
              <Alert severity="info">
                Brak wolnych zdjęć w puli.{" "}
                <Link href={`/images?magazineId=${magazineId}`}>
                  Dodaj zdjęcia w sekcji Zdjęcia
                </Link>
                .
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Wybierz jedno lub więcej zdjęć wcześniej dodanych do magazynu.
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={attachAsMain}
                      onChange={(event) =>
                        setAttachAsMain(event.target.checked)
                      }
                      disabled={pending}
                    />
                  }
                  label="Pierwsze wybrane ustaw jako główne"
                />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 1.5,
                  }}
                >
                  {availablePool.map((image) => {
                    const selected = selectedPoolIds.includes(image.id);
                    return (
                      <Box
                        key={image.id}
                        onClick={() => togglePoolImage(image.id)}
                        sx={{
                          border: 2,
                          borderColor: selected ? "primary.main" : "divider",
                          borderRadius: 1,
                          overflow: "hidden",
                          cursor: "pointer",
                          bgcolor: selected
                            ? "action.selected"
                            : "background.paper",
                        }}
                      >
                        <Box
                          component="img"
                          src={imageContentPath(image)}
                          alt={image.title || image.originalFileName}
                          sx={{
                            display: "block",
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            bgcolor: "action.hover",
                          }}
                        />
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ p: 1, alignItems: "center" }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected}
                            tabIndex={-1}
                            disableRipple
                          />
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                            {image.title || image.originalFileName}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAttachDialog} disabled={pending}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleAttach}
            disabled={pending || selectedPoolIds.length === 0}
          >
            {pending ? "Dołączanie…" : "Dołącz wybrane"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editingImage && editForm)}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="md"
        aria-labelledby="edit-article-image-title"
      >
        <DialogTitle id="edit-article-image-title">
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
                  helperText="Ile modułów szerokości zajmuje zdjęcie"
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
                  helperText="Ile modułów wysokości zajmuje zdjęcie"
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
