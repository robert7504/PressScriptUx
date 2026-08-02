"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useState, useTransition } from "react";
import { deleteSectionAction } from "@/app/actions/sections";

type DeleteSectionButtonProps = {
  id: string;
  name: string;
  issueId: string;
};

export default function DeleteSectionButton({
  id,
  name,
  issueId,
}: DeleteSectionButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Usunąć grzbiet „${name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteSectionAction(id, issueId);
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
        {isPending ? "Usuwanie…" : "Usuń grzbiet"}
      </Button>
    </>
  );
}
