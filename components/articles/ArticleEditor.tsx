"use client";

import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import type QuillType from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["blockquote", "link"],
  ["clean"],
] as const;

type ArticleEditorProps = {
  name?: string;
  label?: string;
  defaultValue?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

function isEmptyHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
}

export default function ArticleEditor({
  name = "content",
  label = "Treść",
  defaultValue = "",
  error = false,
  helperText,
  disabled = false,
}: ArticleEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillType | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    const host = hostRef.current;

    async function mountEditor() {
      if (!host || quillRef.current) return;

      const { default: Quill } = await import("quill");

      if (disposed || !host) return;

      const editorHost = document.createElement("div");
      host.appendChild(editorHost);

      const quill = new Quill(editorHost, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
        },
        placeholder: "Napisz treść artykułu…",
      });

      if (defaultValue) {
        quill.clipboard.dangerouslyPasteHTML(defaultValue);
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        setValue(isEmptyHtml(html) ? "" : html);
      });

      quill.enable(!disabled);
      quillRef.current = quill;
      setReady(true);
    }

    void mountEditor();

    return () => {
      disposed = true;
      quillRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
    };
    // Initialize once; defaultValue is applied only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.enable(!disabled);
  }, [disabled]);

  return (
    <Box>
      <Typography
        variant="body2"
        color={error ? "error" : "text.secondary"}
        sx={{ mb: 0.75 }}
      >
        {label}
      </Typography>
      <input type="hidden" name={name} value={value} />
      <Box
        ref={hostRef}
        sx={{
          minHeight: ready ? undefined : 320,
          width: "100%",
          "& .ql-toolbar.ql-snow": {
            borderColor: error ? "error.main" : "divider",
            borderTopLeftRadius: 1,
            borderTopRightRadius: 1,
            backgroundColor: "background.paper",
          },
          /* Tailwind preflight sets svg { display: block }, which collapses Quill icons */
          "& .ql-toolbar.ql-snow button svg, & .ql-toolbar.ql-snow .ql-picker svg":
            {
              display: "inline",
            },
          "& .ql-container.ql-snow": {
            borderColor: error ? "error.main" : "divider",
            borderBottomLeftRadius: 1,
            borderBottomRightRadius: 1,
            minHeight: 280,
            fontSize: "1rem",
            backgroundColor: "background.paper",
            color: "text.primary",
          },
          "& .ql-editor": {
            minHeight: 280,
          },
          "& .ql-editor.ql-blank::before": {
            fontStyle: "normal",
            color: "text.disabled",
          },
        }}
      />
      {helperText ? (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      ) : null}
    </Box>
  );
}
