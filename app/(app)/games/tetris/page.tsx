import Typography from "@mui/material/Typography";
import TetrisGame from "@/components/games/TetrisGame";

export default function TetrisPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Tetris
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Klasyczna układanka — wyczyść linie, zbieraj punkty i przebij swój rekord.
      </Typography>
      <TetrisGame />
    </>
  );
}
