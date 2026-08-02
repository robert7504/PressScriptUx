import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createMagazineConfigurationAction } from "@/app/actions/magazine-configurations";
import MagazineConfigurationForm from "@/components/magazine-configurations/MagazineConfigurationForm";
import { ApiError } from "@/lib/api/client";
import { listMagazines } from "@/lib/magazines/api";

export default async function NewConfigurationPage() {
  let magazines: { id: string; name: string }[] = [];
  let error: string | null = null;

  try {
    const list = await listMagazines({ active: true });
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
          Nowa konfiguracja
        </Typography>
        <Typography color="text.secondary">
          Utwórz konfigurację i przypisz ją do jednego lub wielu magazynów.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && magazines.length === 0 ? (
        <Alert severity="warning">
          Najpierw dodaj magazyn — konfiguracja wymaga przypisania do co
          najmniej jednego magazynu.
        </Alert>
      ) : null}
      {!error && magazines.length > 0 ? (
        <MagazineConfigurationForm
          action={createMagazineConfigurationAction}
          magazines={magazines}
          submitLabel="Dodaj konfigurację"
        />
      ) : null}
    </>
  );
}
