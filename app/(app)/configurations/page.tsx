import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MagazineConfigurationsTable from "@/components/magazine-configurations/MagazineConfigurationsTable";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";
import type { MagazineConfiguration } from "@/lib/magazine-configurations/types";
import { listMagazines } from "@/lib/magazines/api";

export default async function ConfigurationsPage() {
  let configurations: MagazineConfiguration[] = [];
  let magazineNames: Record<string, string> = {};
  let error: string | null = null;

  try {
    const [configurationList, magazines] = await Promise.all([
      listMagazineConfigurations(),
      listMagazines(),
    ]);
    configurations = configurationList;
    magazineNames = Object.fromEntries(
      magazines.map((magazine) => [magazine.id, magazine.name]),
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy konfiguracji.";
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
            Konfiguracje
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj konfiguracjami magazynów — jedna konfiguracja może być
            przypisana do wielu magazynów.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/configurations/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowa konfiguracja
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? (
        <MagazineConfigurationsTable
          configurations={configurations}
          magazineNames={magazineNames}
        />
      ) : null}
    </>
  );
}
