import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createArticleAction } from "@/app/actions/articles";
import ArticleForm from "@/components/articles/ArticleForm";
import { listIssues } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { listMagazines } from "@/lib/magazines/api";
import type { Magazine } from "@/lib/magazines/types";
import { listSections } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

export default async function NewArticlePage() {
  let magazines: Magazine[] = [];
  let issues: Issue[] = [];
  let sections: Section[] = [];

  try {
    [magazines, issues, sections] = await Promise.all([
      listMagazines({ active: true }),
      listIssues({ active: true }),
      listSections({ active: true }),
    ]);
  } catch {
    magazines = [];
    issues = [];
    sections = [];
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowy artykuł
        </Typography>
        <Typography color="text.secondary">
          Najpierw wybierz magazyn albo grzbiet, potem wypełnij formularz i oddaj
          artykuł do redakcji.
        </Typography>
      </Box>
      <ArticleForm
        action={createArticleAction}
        magazines={magazines}
        issues={issues}
        sections={sections}
        submitLabel="Oddaj artykuł"
      />
    </>
  );
}
