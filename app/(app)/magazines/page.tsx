import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MagazinesTable from "@/components/magazines/MagazinesTable";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { listMagazines } from "@/lib/magazines/api";
import type { Magazine } from "@/lib/magazines/types";
import { listPublishers } from "@/lib/publishers/api";

export default async function MagazinesPage() {
  let magazines: Magazine[] = [];
  let publisherNames: Record<string, string> = {};
  let error: string | null = null;

  try {
    const [magazineList, publishers] = await Promise.all([
      listMagazines(),
      listPublishers(),
    ]);
    magazines = magazineList;
    publisherNames = Object.fromEntries(
      publishers.map((publisher) => [publisher.id, publisher.name]),
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy magazynów.";
  }

  return (
    <>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Magazyny
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj magazynami: dodawaj, edytuj i usuwaj.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/magazines/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowy magazyn
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? (
        <MagazinesTable
          magazines={magazines}
          publisherNames={publisherNames}
        />
      ) : null}
    </>
  );
}
