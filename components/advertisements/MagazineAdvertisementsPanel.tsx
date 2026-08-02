"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createAdvertisementIssuePlanAction,
  deleteAdvertisementIssuePlanAction,
} from "@/app/actions/advertisement-issue-plans";
import {
  deleteAdvertisementAction,
  updateAdvertisementAction,
  uploadAdvertisementAction,
} from "@/app/actions/advertisements";
import type { AdvertisementIssuePlan } from "@/lib/advertisement-issue-plans/types";
import {
  ADVERTISEMENT_STATUSES,
  ADVERTISEMENT_STATUS_LABELS,
  advertisementContentPath,
  advertisementPreviewSrc,
  type Advertisement,
  type AdvertisementStatus,
} from "@/lib/advertisements/types";
import type { Issue } from "@/lib/issues/types";
import type { Magazine } from "@/lib/magazines/types";
import Link from "../Link";

type MagazineAdvertisementsPanelProps = {
  magazines: Magazine[];
  issues: Issue[];
  plans: AdvertisementIssuePlan[];
  initialMagazineId?: string;
  initialAdvertisements: Advertisement[];
  loadError?: string | null;
};

type EditFormState = {
  title: string;
  advertiser: string;
  notes: string;
  status: AdvertisementStatus;
};

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function issueDisplayName(issue: Issue) {
  if (issue.label) return issue.label;
  if (issue.title) return issue.title;
  return `Nr ${issue.issueNumber}/${issue.year}`;
}

function toEditForm(ad: Advertisement): EditFormState {
  return {
    title: ad.title,
    advertiser: ad.advertiser ?? "",
    notes: ad.notes ?? "",
    status: ad.status,
  };
}

function adMatchesQuery(ad: Advertisement, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [ad.title, ad.advertiser ?? "", ad.notes ?? "", ad.originalFileName]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

export default function MagazineAdvertisementsPanel({
  magazines,
  issues,
  plans,
  initialMagazineId,
  initialAdvertisements,
  loadError,
}: MagazineAdvertisementsPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [magazineId, setMagazineId] = useState(
    initialMagazineId ?? magazines[0]?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AdvertisementStatus>("DRAFT");
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [replaceFileName, setReplaceFileName] = useState<string | null>(null);
  const [planningAd, setPlanningAd] = useState<Advertisement | null>(null);
  const [planIssueId, setPlanIssueId] = useState("");
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    setError(loadError ?? null);
  }, [loadError]);

  useEffect(() => {
    if (initialMagazineId) setMagazineId(initialMagazineId);
  }, [initialMagazineId]);

  const issuesById = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of issues) map.set(issue.id, issue);
    return map;
  }, [issues]);

  const magazineIssues = useMemo(
    () => issues.filter((issue) => issue.magazineId === magazineId),
    [issues, magazineId],
  );

  const plansByAdId = useMemo(() => {
    const map = new Map<string, AdvertisementIssuePlan[]>();
    for (const plan of plans) {
      const list = map.get(plan.advertisementId) ?? [];
      list.push(plan);
      map.set(plan.advertisementId, list);
    }
    return map;
  }, [plans]);

  const sortedAds = [...initialAdvertisements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const filteredAds = sortedAds.filter((ad) => adMatchesQuery(ad, searchQuery));
  const trimmedSearch = searchQuery.trim();

  const navigate = (nextMagazineId: string) => {
    const params = new URLSearchParams();
    if (nextMagazineId) params.set("magazineId", nextMagazineId);
    router.push(`/advertisements?${params.toString()}`);
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

  const openEditDialog = (ad: Advertisement) => {
    setEditingAd(ad);
    setEditForm(toEditForm(ad));
    setEditError(null);
    setReplaceFileName(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
  };

  const closeEditDialog = () => {
    if (pending) return;
    setEditingAd(null);
    setEditForm(null);
    setEditError(null);
    setReplaceFileName(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
  };

  const openPlanDialog = (ad: Advertisement) => {
    setPlanningAd(ad);
    setPlanIssueId("");
    setPlanError(null);
  };

  const closePlanDialog = () => {
    if (pending) return;
    setPlanningAd(null);
    setPlanIssueId("");
    setPlanError(null);
  };

  const handleUpload = () => {
    if (!magazineId) {
      setError("Wybierz magazyn.");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Wybierz plik reklamy (PDF lub EPS).");
      return;
    }
    if (!title.trim()) {
      setError("Tytuł jest wymagany.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("advertiser", advertiser);
    formData.append("notes", notes);
    formData.append("status", status);

    runAction(async () => {
      const result = await uploadAdvertisementAction(magazineId, formData);
      if (result.success && fileInputRef.current) {
        fileInputRef.current.value = "";
        setSelectedName(null);
        setTitle("");
        setAdvertiser("");
        setNotes("");
        setStatus("DRAFT");
      }
      return result;
    });
  };

  const handleSaveEdit = () => {
    if (!editingAd || !editForm) return;
    if (!editForm.title.trim()) {
      setEditError("Tytuł jest wymagany.");
      return;
    }

    setEditError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", editForm.title.trim());
      formData.append("advertiser", editForm.advertiser);
      formData.append("notes", editForm.notes);
      formData.append("status", editForm.status);

      const file = replaceFileInputRef.current?.files?.[0];
      if (file) {
        formData.append("file", file);
      }

      const result = await updateAdvertisementAction(editingAd.id, formData);
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setEditingAd(null);
      setEditForm(null);
      setEditError(null);
      setReplaceFileName(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
      router.refresh();
    });
  };

  const handleCreatePlan = () => {
    if (!planningAd || !planIssueId) {
      setPlanError("Wybierz wydanie.");
      return;
    }
    setPlanError(null);
    startTransition(async () => {
      const result = await createAdvertisementIssuePlanAction(
        planningAd.id,
        planIssueId,
      );
      if (result.error) {
        setPlanError(result.error);
        return;
      }
      setPlanIssueId("");
      router.refresh();
    });
  };

  if (magazines.length === 0) {
    return (
      <Alert severity="info">
        Najpierw dodaj magazyn, aby zarządzać reklamami.
      </Alert>
    );
  }

  const planningAdPlans = planningAd
    ? (plansByAdId.get(planningAd.id) ?? [])
    : [];
  const plannedIssueIds = new Set(planningAdPlans.map((p) => p.issueId));
  const availableIssues = magazineIssues.filter(
    (issue) => !plannedIssueIds.has(issue.id),
  );

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: "center" } }}
      >
        <FormControl sx={{ minWidth: 240 }} size="small">
          <InputLabel id="ads-magazine-label">Magazyn</InputLabel>
          <Select
            labelId="ads-magazine-label"
            label="Magazyn"
            value={magazineId}
            onChange={(event) => {
              const next = String(event.target.value);
              setMagazineId(next);
              navigate(next);
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
        <TextField
          label="Szukaj reklamy"
          placeholder="Tytuł, reklamodawca…"
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
          Dodaj reklamę z pliku
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Akceptowane formaty: PDF, EPS. Backend wygeneruje podgląd JPEG.
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
                accept=".pdf,.eps,application/pdf,application/postscript"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedName(file?.name ?? null);
                  setError(null);
                  if (file && !title.trim()) {
                    setTitle(file.name.replace(/\.[^.]+$/, ""));
                  }
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
              label="Tytuł"
              required
              fullWidth
              size="small"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={pending}
              slotProps={{ htmlInput: { maxLength: 512 } }}
            />
            <TextField
              label="Reklamodawca"
              fullWidth
              size="small"
              value={advertiser}
              onChange={(event) => setAdvertiser(event.target.value)}
              disabled={pending}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Notatki"
              fullWidth
              size="small"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={pending}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="ads-upload-status-label">Status</InputLabel>
              <Select
                labelId="ads-upload-status-label"
                label="Status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as AdvertisementStatus)
                }
                disabled={pending}
              >
                {ADVERTISEMENT_STATUSES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {ADVERTISEMENT_STATUS_LABELS[value]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Box>

      {sortedAds.length === 0 ? (
        <Alert severity="info">Brak reklam w tym magazynie.</Alert>
      ) : filteredAds.length === 0 ? (
        <Alert severity="info">Brak wyników dla „{trimmedSearch}”.</Alert>
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
          {filteredAds.map((ad) => {
            const adPlans = plansByAdId.get(ad.id) ?? [];
            return (
              <Box
                key={ad.id}
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
                  src={advertisementPreviewSrc(ad)}
                  alt={ad.title}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: 180,
                    objectFit: "contain",
                    bgcolor: "action.hover",
                  }}
                />
                <Stack spacing={0.75} sx={{ p: 1.25 }}>
                  <Typography variant="body2" noWrap title={ad.title}>
                    {ad.title}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={ADVERTISEMENT_STATUS_LABELS[ad.status]}
                    />
                    {adPlans.length > 0 ? (
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={`${adPlans.length} wyd.`}
                      />
                    ) : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {ad.advertiser || "Bez reklamodawcy"}
                    {" · "}
                    {formatBytes(ad.sizeBytes)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    title={ad.originalFileName}
                  >
                    {ad.originalFileName}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    <Tooltip title="Planuj na wydania">
                      <span>
                        <IconButton
                          size="small"
                          disabled={pending}
                          onClick={() => openPlanDialog(ad)}
                          aria-label="Planuj na wydania"
                        >
                          <EventAvailableOutlinedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Edytuj reklamę">
                      <span>
                        <IconButton
                          size="small"
                          disabled={pending}
                          onClick={() => openEditDialog(ad)}
                          aria-label="Edytuj reklamę"
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Usuń reklamę">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={pending}
                          onClick={() =>
                            runAction(() => deleteAdvertisementAction(ad.id))
                          }
                          aria-label="Usuń reklamę"
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
        open={Boolean(editingAd && editForm)}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="edit-advertisement-title"
      >
        <DialogTitle id="edit-advertisement-title">Edycja reklamy</DialogTitle>
        <DialogContent>
          {editForm && editingAd ? (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              {editError ? <Alert severity="error">{editError}</Alert> : null}
              <Typography variant="body2" color="text.secondary">
                Aktualny plik:{" "}
                <Link
                  href={advertisementContentPath(editingAd.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {editingAd.originalFileName}
                </Link>
              </Typography>
              <TextField
                label="Tytuł"
                required
                fullWidth
                size="small"
                value={editForm.title}
                onChange={(event) =>
                  setEditForm({ ...editForm, title: event.target.value })
                }
                disabled={pending}
                slotProps={{ htmlInput: { maxLength: 512 } }}
              />
              <TextField
                label="Reklamodawca"
                fullWidth
                size="small"
                value={editForm.advertiser}
                onChange={(event) =>
                  setEditForm({ ...editForm, advertiser: event.target.value })
                }
                disabled={pending}
              />
              <TextField
                label="Notatki"
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={editForm.notes}
                onChange={(event) =>
                  setEditForm({ ...editForm, notes: event.target.value })
                }
                disabled={pending}
              />
              <FormControl size="small" fullWidth>
                <InputLabel id="ads-edit-status-label">Status</InputLabel>
                <Select
                  labelId="ads-edit-status-label"
                  label="Status"
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      status: event.target.value as AdvertisementStatus,
                    })
                  }
                  disabled={pending}
                >
                  {ADVERTISEMENT_STATUSES.map((value) => (
                    <MenuItem key={value} value={value}>
                      {ADVERTISEMENT_STATUS_LABELS[value]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                    accept=".pdf,.eps,application/pdf,application/postscript"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setReplaceFileName(file?.name ?? null);
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {replaceFileName ?? "Bez zmiany pliku"}
                </Typography>
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

      <Dialog
        open={Boolean(planningAd)}
        onClose={closePlanDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="plan-advertisement-title"
      >
        <DialogTitle id="plan-advertisement-title">
          Planowanie: {planningAd?.title}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {planError ? <Alert severity="error">{planError}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              Wybierz wydania, w których reklama ma się ukazać.
            </Typography>
            {magazineIssues.length === 0 ? (
              <Alert severity="info">
                Brak wydań dla tego magazynu.{" "}
                <Link href="/issues/new">Dodaj wydanie</Link>
              </Alert>
            ) : (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { sm: "center" } }}
              >
                <FormControl size="small" fullWidth disabled={pending}>
                  <InputLabel id="ads-plan-issue-label">Wydanie</InputLabel>
                  <Select
                    labelId="ads-plan-issue-label"
                    label="Wydanie"
                    value={planIssueId}
                    onChange={(event) =>
                      setPlanIssueId(String(event.target.value))
                    }
                  >
                    {availableIssues.length === 0 ? (
                      <MenuItem value="" disabled>
                        Wszystkie wydania już zaplanowane
                      </MenuItem>
                    ) : (
                      availableIssues.map((issue) => (
                        <MenuItem key={issue.id} value={issue.id}>
                          {issueDisplayName(issue)}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleCreatePlan}
                  disabled={pending || !planIssueId}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Dodaj
                </Button>
              </Stack>
            )}
            {planningAdPlans.length === 0 ? (
              <Alert severity="info">
                Ta reklama nie jest jeszcze przypisana do żadnego wydania.
              </Alert>
            ) : (
              <List dense disablePadding>
                {planningAdPlans.map((plan) => {
                  const issue = issuesById.get(plan.issueId);
                  return (
                    <ListItem
                      key={plan.id}
                      secondaryAction={
                        <Tooltip title="Usuń z planu wydania">
                          <span>
                            <IconButton
                              edge="end"
                              size="small"
                              color="error"
                              disabled={pending}
                              onClick={() =>
                                startTransition(async () => {
                                  setPlanError(null);
                                  const result =
                                    await deleteAdvertisementIssuePlanAction(
                                      plan.id,
                                    );
                                  if (result.error) {
                                    setPlanError(result.error);
                                    return;
                                  }
                                  router.refresh();
                                })
                              }
                              aria-label="Usuń z planu wydania"
                            >
                              <DeleteOutlinedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 1,
                        pr: 6,
                      }}
                    >
                      <ListItemText
                        primary={
                          issue ? (
                            <Link href={`/issues/${issue.id}/edit`}>
                              {issueDisplayName(issue)}
                            </Link>
                          ) : (
                            plan.issueId
                          )
                        }
                        secondary={
                          issue
                            ? `Status wydania: ${issue.status ?? "—"}`
                            : undefined
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePlanDialog} disabled={pending}>
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
