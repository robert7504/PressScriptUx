import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createMagazineAction } from "@/app/actions/magazines";
import MagazineForm from "@/components/magazines/MagazineForm";
import { ApiError } from "@/lib/api/client";
import { listPublishers } from "@/lib/publishers/api";

export default async function NewMagazinePage() {
  let publishers: { id: string; name: string }[] = [];
  let error: string | null = null;

  try {
    const list = await listPublishers();
    publishers = list.map((publisher) => ({
      id: publisher.id,
      name: publisher.name,
    }));
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy wydawców.";
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowy magazyn
        </Typography>
        <Typography color="text.secondary">
          Wypełnij dane magazynu i zapisz.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && publishers.length === 0 ? (
        <Alert severity="warning">
          Najpierw dodaj wydawcę — magazyn wymaga powiązania z wydawcą.
        </Alert>
      ) : null}
      {!error && publishers.length > 0 ? (
        <MagazineForm
          action={createMagazineAction}
          publishers={publishers}
          submitLabel="Dodaj magazyn"
        />
      ) : null}
    </>
  );
}
