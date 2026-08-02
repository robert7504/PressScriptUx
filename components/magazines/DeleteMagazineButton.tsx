"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useState, useTransition } from "react";
import { deleteMagazineAction } from "@/app/actions/magazines";

type DeleteMagazineButtonProps = {
  id: string;
  name: string;
};

export default function DeleteMagazineButton({
  id,
  name,
}: DeleteMagazineButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Usunąć magazyn „${name}”? Tej operacji nie można cofnąć.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteMagazineAction(id);
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
        {isPending ? "Usuwanie…" : "Usuń magazyn"}
      </Button>
    </>
  );
}
