"use client";

import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HttpIcon from "@mui/icons-material/Http";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

type ApiDebugEvent = {
  id: string;
  at: string;
  method: string;
  url: string;
  status?: number;
  durationMs: number;
  error?: string;
  responseBody?: string;
  curl: string;
};

type CopiedKind = "curl" | "error";

function statusColor(status?: number): "default" | "success" | "warning" | "error" {
  if (status == null) return "error";
  if (status >= 200 && status < 300) return "success";
  if (status >= 400) return "error";
  return "warning";
}

function formatErrorPayload(event: ApiDebugEvent) {
  if (event.responseBody) {
    try {
      return JSON.stringify(JSON.parse(event.responseBody), null, 2);
    } catch {
      return event.responseBody;
    }
  }
  return event.error ?? "";
}

function hasErrorDetails(event: ApiDebugEvent) {
  return Boolean(event.error || event.responseBody || event.status == null || (event.status != null && event.status >= 400));
}

export default function ApiDebugPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<ApiDebugEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<{ id: string; kind: CopiedKind } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/debug/requests", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { events: ApiDebugEvent[] };
        if (!cancelled) setEvents(data.events);
      } catch {
        // Debug endpoint may be unavailable outside local development.
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const markCopied = (id: string, kind: CopiedKind) => {
    setCopied({ id, kind });
    window.setTimeout(
      () =>
        setCopied((current) =>
          current?.id === id && current.kind === kind ? null : current,
        ),
      1500,
    );
  };

  const copyCurl = async (event: ApiDebugEvent) => {
    await navigator.clipboard.writeText(event.curl);
    markCopied(event.id, "curl");
  };

  const copyError = async (event: ApiDebugEvent) => {
    const payload = formatErrorPayload(event);
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    markCopied(event.id, "error");
  };

  const clearEvents = async () => {
    await fetch("/api/debug/requests", { method: "DELETE" });
    setEvents([]);
    setExpandedId(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <Box
      sx={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.modal + 1,
        width: open ? { xs: "calc(100vw - 32px)", sm: 560 } : "auto",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {!open ? (
        <Tooltip title="API debug (curl + errors)">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<HttpIcon />}
            onClick={() => setOpen(true)}
            sx={{ boxShadow: 3 }}
          >
            API ({events.length})
          </Button>
        </Tooltip>
      ) : (
        <Paper elevation={8} sx={{ overflow: "hidden" }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              px: 1.5,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <HttpIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              REST API debug
            </Typography>
            <Tooltip title="Clear">
              <IconButton size="small" onClick={() => void clearEvents()} aria-label="clear">
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              aria-label="collapse"
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box sx={{ maxHeight: 420, overflow: "auto" }}>
            {events.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                Brak requestów. Przejdź po appce, pojawią się tutaj.
              </Typography>
            ) : (
              events.map((event) => {
                const errored = hasErrorDetails(event);
                const expanded = expandedId === event.id;
                const errorPayload = formatErrorPayload(event);
                const copiedCurl =
                  copied?.id === event.id && copied.kind === "curl";
                const copiedError =
                  copied?.id === event.id && copied.kind === "error";

                return (
                  <Box
                    key={event.id}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Chip size="small" label={event.method} />
                      <Chip
                        size="small"
                        color={statusColor(event.status)}
                        label={event.status ?? "ERR"}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {event.durationMs}ms
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      {errored ? (
                        <Tooltip
                          title={
                            expanded ? "Ukryj błąd" : "Podejrzyj błąd"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => toggleExpanded(event.id)}
                            aria-label="toggle error details"
                            color={expanded ? "error" : "default"}
                          >
                            <BugReportOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {errored && errorPayload ? (
                        <Tooltip
                          title={
                            copiedError ? "Skopiowano błąd" : "Copy error"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => void copyError(event)}
                            aria-label="copy error"
                          >
                            <ContentCopyIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Tooltip
                        title={copiedCurl ? "Skopiowano" : "Copy as cURL"}
                      >
                        <IconButton
                          size="small"
                          onClick={() => void copyCurl(event)}
                          aria-label="copy curl"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 12,
                        wordBreak: "break-all",
                      }}
                    >
                      {event.url}
                    </Typography>
                    {event.error && !expanded ? (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{
                          display: "block",
                          mt: 0.25,
                          cursor: "pointer",
                        }}
                        onClick={() => toggleExpanded(event.id)}
                      >
                        {event.error}
                      </Typography>
                    ) : null}
                    <Collapse in={expanded}>
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(244, 67, 54, 0.12)"
                              : "rgba(244, 67, 54, 0.06)",
                          border: 1,
                          borderColor: "error.light",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", mb: 0.5 }}
                        >
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ fontWeight: 600, flex: 1 }}
                          >
                            {event.error ?? "Error response"}
                          </Typography>
                          {errorPayload ? (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<ContentCopyIcon />}
                              onClick={() => void copyError(event)}
                            >
                              {copiedError ? "Skopiowano" : "Copy error"}
                            </Button>
                          ) : null}
                        </Stack>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1,
                            maxHeight: 180,
                            overflow: "auto",
                            borderRadius: 1,
                            bgcolor: "background.paper",
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: 11,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            userSelect: "text",
                          }}
                        >
                          {errorPayload || "Brak body odpowiedzi."}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })
            )}
          </Box>

          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              px: 1.5,
              py: 0.75,
              bgcolor: "action.hover",
            }}
          >
            <ExpandLessIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} />
            <Typography variant="caption" color="text.secondary">
              Bug icon → podgląd błędu · czerwony copy → error · szary copy →
              cURL
            </Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
