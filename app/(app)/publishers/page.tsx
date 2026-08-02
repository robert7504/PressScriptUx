import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PublishersTable from "@/components/publishers/PublishersTable";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { listPublishers } from "@/lib/publishers/api";
import type { Publisher } from "@/lib/publishers/types";

export default async function PublishersPage() {
  let publishers: Publisher[] = [];
  let error: string | null = null;

  try {
    publishers = await listPublishers();
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy wydawców.";
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
            Wydawcy
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj wydawcami: dodawaj, edytuj i usuwaj.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/publishers/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowy wydawca
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? <PublishersTable publishers={publishers} /> : null}
    </>
  );
}
