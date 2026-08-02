import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import SectionsTable from "@/components/sections/SectionsTable";
import { ApiError } from "@/lib/api/client";
import { listIssues } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { listSections } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

function issueLabel(issue: Issue) {
  if (issue.label) return issue.label;
  if (issue.title) return issue.title;
  return `Nr ${issue.issueNumber}/${issue.year}`;
}

export default async function SectionsPage() {
  let sections: Section[] = [];
  let issueLabels: Record<string, string> = {};
  let error: string | null = null;

  try {
    const [sectionList, issues] = await Promise.all([
      listSections(),
      listIssues(),
    ]);
    sections = sectionList;
    issueLabels = Object.fromEntries(
      issues.map((issue) => [issue.id, issueLabel(issue)]),
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy grzbietów.";
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
            Grzbiety
          </Typography>
          <Typography color="text.secondary">
            Zarządzaj grzbietami wydań — sekcjami, do których trafiają artykuły
            i strony.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/sections/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowy grzbiet
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? (
        <SectionsTable sections={sections} issueLabels={issueLabels} />
      ) : null}
    </>
  );
}
