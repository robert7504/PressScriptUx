import Typography from "@mui/material/Typography";

export default function Home() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary">
        Welcome to PressScript. Choose a section from the side menu.
      </Typography>
    </>
  );
}
