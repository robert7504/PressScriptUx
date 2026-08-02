import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createPublisherAction } from "@/app/actions/publishers";
import PublisherForm from "@/components/publishers/PublisherForm";

export default function NewPublisherPage() {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowy wydawca
        </Typography>
        <Typography color="text.secondary">
          Wypełnij dane wydawcy i zapisz.
        </Typography>
      </Box>
      <PublisherForm
        action={createPublisherAction}
        submitLabel="Dodaj wydawcę"
      />
    </>
  );
}
