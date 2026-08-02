"use client";

import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { Article } from "@/lib/articles/types";
import { ARTICLE_STATUS_LABELS } from "@/lib/articles/types";
import { formatDateTime } from "@/lib/formatDate";
import Link from "../Link";

export default function ArticlesTable({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          Brak artykułów. Dodaj pierwszy artykuł, aby zacząć pracę.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tytuł</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Autor</TableCell>
            <TableCell>Zaktualizowano</TableCell>
            <TableCell align="right">Akcje</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {article.title}
                </Typography>
                {article.kicker ? (
                  <Typography variant="caption" color="text.secondary">
                    {article.kicker}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={ARTICLE_STATUS_LABELS[article.status]}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{article.byline || "—"}</TableCell>
              <TableCell>{formatDateTime(article.updatedAt)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edytuj">
                  <IconButton
                    component={Link}
                    href={`/articles/${article.id}/edit`}
                    size="small"
                    aria-label={`Edytuj ${article.title}`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
