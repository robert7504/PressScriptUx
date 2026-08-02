"use client";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useReducer, useRef } from "react";

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const PREVIEW_CELL = 22;

type Cell = string | null;
type Board = Cell[][];
type Point = { x: number; y: number };
type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

type Piece = {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
};

type GameStatus = "idle" | "playing" | "paused" | "over";

type GameState = {
  board: Board;
  active: Piece | null;
  next: PieceType;
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  clearingRows: number[];
};

type Action =
  | { type: "TICK" }
  | { type: "MOVE"; dx: number }
  | { type: "ROTATE" }
  | { type: "SOFT_DROP" }
  | { type: "HARD_DROP" }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FINISH_CLEAR" };

const SHAPES: Record<PieceType, Point[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
    [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  ],
  O: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  ],
  T: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
};

const COLORS: Record<
  PieceType,
  { base: string; light: string; dark: string; glow: string }
> = {
  I: { base: "#22d3ee", light: "#a5f3fc", dark: "#0891b2", glow: "#22d3ee88" },
  O: { base: "#fbbf24", light: "#fde68a", dark: "#d97706", glow: "#fbbf2488" },
  T: { base: "#c084fc", light: "#e9d5ff", dark: "#9333ea", glow: "#c084fc88" },
  S: { base: "#4ade80", light: "#bbf7d0", dark: "#16a34a", glow: "#4ade8088" },
  Z: { base: "#f87171", light: "#fecaca", dark: "#dc2626", glow: "#f8717188" },
  J: { base: "#60a5fa", light: "#bfdbfe", dark: "#2563eb", glow: "#60a5fa88" },
  L: { base: "#fb923c", light: "#fed7aa", dark: "#ea580c", glow: "#fb923c88" },
};

const PIECE_TYPES = Object.keys(SHAPES) as PieceType[];
const LINE_SCORES = [0, 100, 300, 500, 800];

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

function randomType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]!;
}

function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: 3, y: 0 };
}

function getCells(piece: Piece): Point[] {
  const rotations = SHAPES[piece.type];
  const shape = rotations[piece.rotation % rotations.length]!;
  return shape.map((p) => ({ x: piece.x + p.x, y: piece.y + p.y }));
}

function collides(board: Board, piece: Piece): boolean {
  return getCells(piece).some(
    ({ x, y }) =>
      x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y]![x] != null),
  );
}

function lockPiece(board: Board, piece: Piece): Board {
  const next = board.map((row) => [...row]);
  for (const { x, y } of getCells(piece)) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      next[y]![x] = piece.type;
    }
  }
  return next;
}

function findFullRows(board: Board): number[] {
  return board.reduce<number[]>((rows, row, index) => {
    if (row.every((cell) => cell != null)) rows.push(index);
    return rows;
  }, []);
}

function clearRows(board: Board, rows: number[]): Board {
  const remaining = board.filter((_, index) => !rows.includes(index));
  const empty = Array.from({ length: rows.length }, () =>
    Array<Cell>(COLS).fill(null),
  );
  return [...empty, ...remaining];
}

function ghostY(board: Board, piece: Piece): number {
  let ghost = { ...piece };
  while (!collides(board, { ...ghost, y: ghost.y + 1 })) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return ghost.y;
}

function tryRotate(board: Board, piece: Piece): Piece | null {
  const rotations = SHAPES[piece.type];
  const nextRotation = (piece.rotation + 1) % rotations.length;
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    const candidate = { ...piece, rotation: nextRotation, x: piece.x + kick };
    if (!collides(board, candidate)) return candidate;
  }
  return null;
}

function dropDistance(board: Board, piece: Piece): number {
  return ghostY(board, piece) - piece.y;
}

function placeOrSpawn(
  board: Board,
  nextType: PieceType,
  score: number,
  level: number,
  lines: number,
): Pick<
  GameState,
  "board" | "active" | "next" | "status" | "score" | "lines" | "level" | "clearingRows"
> {
  const fullRows = findFullRows(board);
  if (fullRows.length > 0) {
    return {
      board,
      active: null,
      next: nextType,
      status: "playing",
      score,
      lines,
      level,
      clearingRows: fullRows,
    };
  }

  const active = spawnPiece(nextType);
  const following = randomType();
  if (collides(board, active)) {
    return {
      board,
      active: null,
      next: following,
      status: "over",
      score,
      lines,
      level,
      clearingRows: [],
    };
  }

  return {
    board,
    active,
    next: following,
    status: "playing",
    score,
    lines,
    level,
    clearingRows: [],
  };
}

function createInitialState(): GameState {
  return {
    board: createBoard(),
    active: null,
    next: randomType(),
    status: "idle",
    score: 0,
    lines: 0,
    level: 1,
    clearingRows: [],
  };
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === "START") {
    const first = spawnPiece(state.next);
    return {
      board: createBoard(),
      active: first,
      next: randomType(),
      status: "playing",
      score: 0,
      lines: 0,
      level: 1,
      clearingRows: [],
    };
  }

  if (action.type === "PAUSE" && state.status === "playing") {
    return { ...state, status: "paused" };
  }

  if (action.type === "RESUME" && state.status === "paused") {
    return { ...state, status: "playing" };
  }

  if (action.type === "FINISH_CLEAR") {
    if (state.clearingRows.length === 0) return state;
    const cleared = state.clearingRows.length;
    const board = clearRows(state.board, state.clearingRows);
    const lines = state.lines + cleared;
    const level = Math.floor(lines / 10) + 1;
    const score =
      state.score + (LINE_SCORES[cleared] ?? 0) * state.level;
    const placed = placeOrSpawn(board, state.next, score, level, lines);
    return { ...state, ...placed };
  }

  if (state.status !== "playing" || !state.active || state.clearingRows.length) {
    return state;
  }

  if (action.type === "MOVE") {
    const next = { ...state.active, x: state.active.x + action.dx };
    if (collides(state.board, next)) return state;
    return { ...state, active: next };
  }

  if (action.type === "ROTATE") {
    const rotated = tryRotate(state.board, state.active);
    if (!rotated) return state;
    return { ...state, active: rotated };
  }

  if (action.type === "SOFT_DROP") {
    const next = { ...state.active, y: state.active.y + 1 };
    if (!collides(state.board, next)) {
      return { ...state, active: next, score: state.score + 1 };
    }
    const locked = lockPiece(state.board, state.active);
    const placed = placeOrSpawn(
      locked,
      state.next,
      state.score,
      state.level,
      state.lines,
    );
    return { ...state, ...placed };
  }

  if (action.type === "HARD_DROP") {
    const distance = dropDistance(state.board, state.active);
    const dropped = { ...state.active, y: state.active.y + distance };
    const locked = lockPiece(state.board, dropped);
    const placed = placeOrSpawn(
      locked,
      state.next,
      state.score + distance * 2,
      state.level,
      state.lines,
    );
    return { ...state, ...placed };
  }

  if (action.type === "TICK") {
    const next = { ...state.active, y: state.active.y + 1 };
    if (!collides(state.board, next)) {
      return { ...state, active: next };
    }
    const locked = lockPiece(state.board, state.active);
    const placed = placeOrSpawn(
      locked,
      state.next,
      state.score,
      state.level,
      state.lines,
    );
    return { ...state, ...placed };
  }

  return state;
}

function CellBlock({
  color,
  size,
  ghost = false,
  clearing = false,
}: {
  color: PieceType | null;
  size: number;
  ghost?: boolean;
  clearing?: boolean;
}) {
  if (!color) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "3px",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.18))",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      />
    );
  }

  const palette = COLORS[color];

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "4px",
        position: "relative",
        overflow: "hidden",
        opacity: ghost ? 0.28 : 1,
        transform: clearing ? "scaleY(0.15)" : "scale(1)",
        transition: clearing
          ? "transform 180ms ease, opacity 180ms ease"
          : "transform 80ms ease",
        background: ghost
          ? `linear-gradient(145deg, ${palette.light}55, ${palette.base}33)`
          : `linear-gradient(145deg, ${palette.light}, ${palette.base} 45%, ${palette.dark})`,
        boxShadow: ghost
          ? `inset 0 0 0 1px ${palette.base}`
          : `0 0 10px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.25)`,
        "&::after": ghost
          ? undefined
          : {
              content: '""',
              position: "absolute",
              top: 2,
              left: 2,
              right: "40%",
              height: "35%",
              borderRadius: "2px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)",
            },
      }}
    />
  );
}

function MiniPiece({ type }: { type: PieceType }) {
  const rotations = SHAPES[type];
  const cells = rotations[0]!;
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  const width = maxX + 1;
  const height = maxY + 1;
  const occupied = new Set(cells.map((c) => `${c.x},${c.y}`));

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${width}, ${PREVIEW_CELL}px)`,
        gridTemplateRows: `repeat(${height}, ${PREVIEW_CELL}px)`,
        gap: "2px",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: width * height }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const filled = occupied.has(`${x},${y}`);
        return (
          <CellBlock
            key={`${x}-${y}`}
            color={filled ? type : null}
            size={PREVIEW_CELL}
          />
        );
      })}
    </Box>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontWeight: 700,
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function TetrisGame() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const clearingRef = useRef(false);

  useEffect(() => {
    if (state.status !== "playing" || state.clearingRows.length > 0) return;
    const delay = Math.max(120, 800 - (state.level - 1) * 70);
    const id = window.setInterval(() => dispatch({ type: "TICK" }), delay);
    return () => window.clearInterval(id);
  }, [state.status, state.level, state.clearingRows.length]);

  useEffect(() => {
    if (state.clearingRows.length === 0) {
      clearingRef.current = false;
      return;
    }
    if (clearingRef.current) return;
    clearingRef.current = true;
    const id = window.setTimeout(() => dispatch({ type: "FINISH_CLEAR" }), 200);
    return () => window.clearTimeout(id);
  }, [state.clearingRows]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "p"].includes(key)) {
        event.preventDefault();
      }

      if (key === "p") {
        if (state.status === "playing") dispatch({ type: "PAUSE" });
        else if (state.status === "paused") dispatch({ type: "RESUME" });
        return;
      }

      if (state.status === "idle" || state.status === "over") {
        if (key === "enter" || key === " ") dispatch({ type: "START" });
        return;
      }

      if (state.status !== "playing") return;

      if (key === "arrowleft" || key === "a") dispatch({ type: "MOVE", dx: -1 });
      if (key === "arrowright" || key === "d") dispatch({ type: "MOVE", dx: 1 });
      if (key === "arrowdown" || key === "s") dispatch({ type: "SOFT_DROP" });
      if (key === "arrowup" || key === "w" || key === "x") {
        dispatch({ type: "ROTATE" });
      }
      if (key === " ") dispatch({ type: "HARD_DROP" });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status]);

  const display: (PieceType | null)[][] = state.board.map((row) =>
    row.map((cell) => cell as PieceType | null),
  );
  const ghostCells = new Set<string>();
  const activeCells = new Set<string>();

  if (state.active) {
    const gy = ghostY(state.board, state.active);
    for (const cell of getCells({ ...state.active, y: gy })) {
      if (cell.y >= 0) ghostCells.add(`${cell.x},${cell.y}`);
    }
    for (const cell of getCells(state.active)) {
      if (cell.y >= 0) {
        activeCells.add(`${cell.x},${cell.y}`);
        display[cell.y]![cell.x] = state.active.type;
      }
    }
  }

  const overlayLabel =
    state.status === "idle"
      ? "Naciśnij Start"
      : state.status === "paused"
        ? "Pauza"
        : state.status === "over"
          ? "Game Over"
          : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: 1.5,
          borderRadius: 3,
          background:
            "radial-gradient(circle at 20% 10%, rgba(56,189,248,0.18), transparent 40%), radial-gradient(circle at 80% 90%, rgba(192,132,252,0.16), transparent 45%), linear-gradient(160deg, #101826, #0b1220 55%, #111827)",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
            gap: "2px",
            p: "6px",
            borderRadius: 2,
            background: "rgba(0,0,0,0.35)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
          }}
        >
          {display.flatMap((row, y) =>
            row.map((cell, x) => {
              const key = `${x},${y}`;
              const isActive = activeCells.has(key);
              const isGhost = !isActive && ghostCells.has(key);
              return (
                <CellBlock
                  key={key}
                  color={isGhost ? state.active!.type : cell}
                  size={CELL}
                  ghost={isGhost}
                  clearing={state.clearingRows.includes(y)}
                />
              );
            }),
          )}
        </Box>

        {overlayLabel ? (
          <Box
            sx={{
              position: "absolute",
              inset: 12,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background: "rgba(8, 12, 20, 0.72)",
              backdropFilter: "blur(4px)",
              zIndex: 2,
            }}
          >
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  color: "#f8fafc",
                  textShadow: "0 0 24px rgba(56,189,248,0.45)",
                }}
              >
                {overlayLabel}
              </Typography>
              {state.status === "over" ? (
                <Typography sx={{ color: "rgba(248,250,252,0.7)" }}>
                  Wynik: {state.score}
                </Typography>
              ) : null}
              <Button
                variant="contained"
                startIcon={
                  state.status === "paused" ? <PlayArrowIcon /> : <ReplayIcon />
                }
                onClick={() =>
                  dispatch({
                    type: state.status === "paused" ? "RESUME" : "START",
                  })
                }
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                  boxShadow: "0 8px 24px rgba(56,189,248,0.35)",
                }}
              >
                {state.status === "paused" ? "Wznów" : "Start"}
              </Button>
            </Stack>
          </Box>
        ) : null}
      </Box>

      <Stack spacing={2} sx={{ minWidth: 180, color: "#e2e8f0" }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            background:
              "linear-gradient(160deg, rgba(16,24,38,0.95), rgba(11,18,32,0.95))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Następny
          </Typography>
          <Box sx={{ mt: 1.5, minHeight: 90, display: "grid", placeItems: "center" }}>
            <MiniPiece type={state.next} />
          </Box>
        </Box>

        <StatCard label="Wynik" value={state.score} />
        <StatCard label="Linie" value={state.lines} />
        <StatCard label="Poziom" value={state.level} />

        <Stack direction="row" spacing={1}>
          {state.status === "playing" ? (
            <Button
              variant="outlined"
              startIcon={<PauseIcon />}
              onClick={() => dispatch({ type: "PAUSE" })}
              sx={{
                flex: 1,
                borderColor: "rgba(255,255,255,0.2)",
                color: "#e2e8f0",
                textTransform: "none",
              }}
            >
              Pauza
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={
                state.status === "paused" ? <PlayArrowIcon /> : <PlayArrowIcon />
              }
              onClick={() =>
                dispatch({
                  type: state.status === "paused" ? "RESUME" : "START",
                })
              }
              sx={{
                flex: 1,
                textTransform: "none",
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              }}
            >
              {state.status === "paused" ? "Wznów" : "Start"}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={() => dispatch({ type: "START" })}
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "#e2e8f0",
              textTransform: "none",
              minWidth: 0,
              px: 1.5,
            }}
          >
            Reset
          </Button>
        </Stack>

        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: "rgba(15,23,42,0.55)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
            Sterowanie
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.7 }}>
            ← → ruch
            <br />
            ↑ obrót
            <br />
            ↓ miękki drop
            <br />
            Spacja twardy drop
            <br />P pauza
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
