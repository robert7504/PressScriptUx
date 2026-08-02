"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState } from "react";
import type { Publisher, PublisherFormState } from "@/lib/publishers/types";
import Link from "../Link";

const initialState: PublisherFormState = {};

type PublisherFormProps = {
  action: (
    prevState: PublisherFormState,
    formData: FormData,
  ) => Promise<PublisherFormState>;
  publisher?: Publisher;
  submitLabel: string;
  cancelHref?: string;
};

export default function PublisherForm({
  action,
  publisher,
  submitLabel,
  cancelHref = "/publishers",
}: PublisherFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Wydawca został zapisany.</Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Nazwa"
          required
          fullWidth
          defaultValue={publisher?.name ?? ""}
          error={Boolean(state.fieldErrors?.name)}
          helperText={state.fieldErrors?.name}
          disabled={pending}
        />
        <TextField
          name="shortName"
          label="Nazwa skrócona"
          fullWidth
          defaultValue={publisher?.shortName ?? ""}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="taxId"
          label="NIP"
          fullWidth
          defaultValue={publisher?.taxId ?? ""}
          disabled={pending}
        />
        <TextField
          name="regon"
          label="REGON"
          fullWidth
          defaultValue={publisher?.regon ?? ""}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="email"
          label="E-mail"
          type="email"
          fullWidth
          defaultValue={publisher?.email ?? ""}
          error={Boolean(state.fieldErrors?.email)}
          helperText={state.fieldErrors?.email}
          disabled={pending}
        />
        <TextField
          name="phone"
          label="Telefon"
          fullWidth
          defaultValue={publisher?.phone ?? ""}
          disabled={pending}
        />
      </Stack>

      <TextField
        name="website"
        label="Strona WWW"
        fullWidth
        defaultValue={publisher?.website ?? ""}
        disabled={pending}
      />

      <TextField
        name="street"
        label="Ulica"
        fullWidth
        defaultValue={publisher?.street ?? ""}
        disabled={pending}
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="postalCode"
          label="Kod pocztowy"
          fullWidth
          defaultValue={publisher?.postalCode ?? ""}
          disabled={pending}
        />
        <TextField
          name="city"
          label="Miasto"
          fullWidth
          defaultValue={publisher?.city ?? ""}
          disabled={pending}
        />
        <TextField
          name="country"
          label="Kraj"
          fullWidth
          defaultValue={publisher?.country ?? ""}
          disabled={pending}
        />
      </Stack>

      <TextField
        name="notes"
        label="Notatki"
        fullWidth
        multiline
        minRows={2}
        defaultValue={publisher?.notes ?? ""}
        disabled={pending}
      />

      {publisher ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="publisher-active-label">Status</InputLabel>
          <Select
            labelId="publisher-active-label"
            name="active"
            label="Status"
            defaultValue={publisher.active ? "true" : "false"}
          >
            <MenuItem value="true">Aktywny</MenuItem>
            <MenuItem value="false">Nieaktywny</MenuItem>
          </Select>
        </FormControl>
      ) : null}

      <Stack direction="row" spacing={1.5}>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Zapisywanie…" : submitLabel}
        </Button>
        <Button
          component={Link}
          href={cancelHref}
          variant="outlined"
          disabled={pending}
        >
          Anuluj
        </Button>
      </Stack>
    </Box>
  );
}
