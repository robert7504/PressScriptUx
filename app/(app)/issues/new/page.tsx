import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createIssueAction } from "@/app/actions/issues";
import IssueForm from "@/components/issues/IssueForm";
import { ApiError } from "@/lib/api/client";
import { listMagazines } from "@/lib/magazines/api";

export default async function NewIssuePage() {
  let magazines: { id: string; name: string }[] = [];
  let error: string | null = null;

  try {
    const list = await listMagazines();
    magazines = list.map((magazine) => ({
      id: magazine.id,
      name: magazine.name,
    }));
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy magazynów.";
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowe wydanie
        </Typography>
        <Typography color="text.secondary">
          Wypełnij dane wydania i zapisz.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && magazines.length === 0 ? (
        <Alert severity="warning">
          Najpierw dodaj magazyn — wydanie wymaga powiązania z magazynem.
        </Alert>
      ) : null}
      {!error && magazines.length > 0 ? (
        <IssueForm
          action={createIssueAction}
          magazines={magazines}
          submitLabel="Dodaj wydanie"
        />
      ) : null}
    </>
  );
}
