import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import ParagraphStylesTable from "@/components/paragraph-styles/ParagraphStylesTable";
import { ApiError } from "@/lib/api/client";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";
import { listParagraphStyles } from "@/lib/paragraph-styles/api";
import type { ParagraphStyle } from "@/lib/paragraph-styles/types";

export default async function ParagraphStylesPage() {
  let styles: ParagraphStyle[] = [];
  let configurationNames: Record<string, string> = {};
  let error: string | null = null;

  try {
    const [styleList, configurations] = await Promise.all([
      listParagraphStyles(),
      listMagazineConfigurations(),
    ]);
    styles = styleList;
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
        : "Nie udało się pobrać listy stylów akapitowych.";
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
            Style akapitowe
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj stylami akapitowymi — każdy styl jest dołączony do jednej
            konfiguracji.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/paragraph-styles/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowy styl
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? (
        <ParagraphStylesTable
          styles={styles}
          configurationNames={configurationNames}
        />
      ) : null}
    </>
  );
}
