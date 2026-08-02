"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HttpIcon from "@mui/icons-material/Http";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
  curl: string;
};

function statusColor(status?: number): "default" | "success" | "warning" | "error" {
  if (status == null) return "error";
  if (status >= 200 && status < 300) return "success";
  if (status >= 400) return "error";
  return "warning";
}

export default function ApiDebugPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<ApiDebugEvent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyCurl = async (event: ApiDebugEvent) => {
    await navigator.clipboard.writeText(event.curl);
    setCopiedId(event.id);
    window.setTimeout(() => setCopiedId((id) => (id === event.id ? null : id)), 1500);
  };

  const clearEvents = async () => {
    await fetch("/api/debug/requests", { method: "DELETE" });
    setEvents([]);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.modal + 1,
        width: open ? { xs: "calc(100vw - 32px)", sm: 520 } : "auto",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {!open ? (
        <Tooltip title="API debug (copy curl)">
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

          <Box sx={{ maxHeight: 360, overflow: "auto" }}>
            {events.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                Brak requestów. Przejdź po appce, pojawią się tutaj.
              </Typography>
            ) : (
              events.map((event) => (
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
                    <Tooltip
                      title={copiedId === event.id ? "Skopiowano" : "Copy as cURL"}
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
                  {event.error ? (
                    <Typography variant="caption" color="error">
                      {event.error}
                    </Typography>
                  ) : null}
                </Box>
              ))
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
              Copy as cURL → wklej w Postmanie (Import → Raw text)
            </Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
