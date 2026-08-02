import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createArticleAction } from "@/app/actions/articles";
import ArticleForm from "@/components/articles/ArticleForm";
import { listSections } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

export default async function NewArticlePage() {
  let sections: Section[] = [];
  try {
    sections = await listSections({ active: true });
  } catch {
    sections = [];
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowy artykuł
        </Typography>
        <Typography color="text.secondary">
          Wypełnij formularz i oddaj artykuł do redakcji.
        </Typography>
      </Box>
      <ArticleForm
        action={createArticleAction}
        sections={sections}
        submitLabel="Oddaj artykuł"
      />
    </>
  );
}
