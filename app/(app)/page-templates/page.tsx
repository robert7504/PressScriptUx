import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import PageTemplatesTable from "@/components/page-templates/PageTemplatesTable";
import { ApiError } from "@/lib/api/client";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";
import { listPageTemplates } from "@/lib/page-templates/api";
import type { PageTemplate } from "@/lib/page-templates/types";

export default async function PageTemplatesPage() {
  let templates: PageTemplate[] = [];
  let configurationNames: Record<string, string> = {};
  let error: string | null = null;

  try {
    const [templateList, configurations] = await Promise.all([
      listPageTemplates(),
      listMagazineConfigurations(),
    ]);
    templates = templateList;
    configurationNames = Object.fromEntries(
      configurations.map((configuration) => [
        configuration.id,
        configuration.name,
      ]),
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy wzorców stron.";
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
            Wzorce stron
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj wzorcami stron — każdy wzorzec jest dołączony do jednej
            konfiguracji.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/page-templates/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowy wzorzec
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? (
        <PageTemplatesTable
          templates={templates}
          configurationNames={configurationNames}
        />
      ) : null}
    </>
  );
}
