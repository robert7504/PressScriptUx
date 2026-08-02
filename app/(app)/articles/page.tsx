import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArticlesTable from "@/components/articles/ArticlesTable";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { listArticles } from "@/lib/articles/api";
import type { Article } from "@/lib/articles/types";

export default async function ArticlesPage() {
  let articles: Article[] = [];
  let error: string | null = null;

  try {
    articles = await listArticles({ active: true });
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy artykułów.";
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
            Artykuły
          </Typography>
          <Typography color="text.secondary">
            Oddawaj i edytuj artykuły redakcyjne.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/articles/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nowy artykuł
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error ? <ArticlesTable articles={articles} /> : null}
    </>
  );
}
