"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useState, useTransition } from "react";
import { deleteIssueAction } from "@/app/actions/issues";

type DeleteIssueButtonProps = {
  id: string;
  label: string;
};

export default function DeleteIssueButton({
  id,
  label,
}: DeleteIssueButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Usunąć wydanie „${label}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteIssueAction(id);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? "Usuwanie…" : "Usuń wydanie"}
      </Button>
    </>
  );
}
