import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/";

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        background:
          "linear-gradient(160deg, var(--mui-palette-grey-100) 0%, var(--mui-palette-background-default) 45%, var(--mui-palette-grey-200) 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          PressScript
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Sign in with your account to continue.
        </Typography>
        <LoginForm nextPath={nextPath} />
      </Paper>
    </Box>
  );
}
