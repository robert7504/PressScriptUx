"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import type { LoginFormState } from "@/lib/auth/types";

const initialState: LoginFormState = {};

export default function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <Box
      component="form"
      action={action}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <input type="hidden" name="next" value={nextPath} />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}

      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        fullWidth
        autoFocus
        error={Boolean(state.fieldErrors?.email)}
        helperText={state.fieldErrors?.email}
        disabled={pending}
      />

      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        fullWidth
        error={Boolean(state.fieldErrors?.password)}
        helperText={state.fieldErrors?.password}
        disabled={pending}
      />

      <Button type="submit" variant="contained" size="large" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </Box>
  );
}
