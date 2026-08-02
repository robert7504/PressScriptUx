import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IssuesTable from "@/components/issues/IssuesTable";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { listIssues } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { listMagazines } from "@/lib/magazines/api";

export default async function IssuesPage() {
  let issues: Issue[] = [];
  let magazineNames: Record<string, string> = {};
  let error: string | null = null;

  try {
    const [issueList, magazines] = await Promise.all([
      listIssues(),
      listMagazines(),
    ]);
    issues = issueList;
    magazineNames = Object.fromEntries(
      magazines.map((magazine) => [magazine.id, magazine.name]),
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy wydań.";
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
            Wydania
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj wydaniami magazynów: dodawaj, edytuj i usuwaj.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/issues/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowe wydanie
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? (
        <IssuesTable issues={issues} magazineNames={magazineNames} />
      ) : null}
    </>
  );
}
