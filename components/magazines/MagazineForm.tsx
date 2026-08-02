"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState } from "react";
import {
  MAGAZINE_FREQUENCIES,
  MAGAZINE_FREQUENCY_LABELS,
  type Magazine,
  type MagazineFormState,
} from "@/lib/magazines/types";
import Link from "../Link";

const initialState: MagazineFormState = {};

export type MagazinePublisherOption = {
  id: string;
  name: string;
};

type MagazineFormProps = {
  action: (
    prevState: MagazineFormState,
    formData: FormData,
  ) => Promise<MagazineFormState>;
  magazine?: Magazine;
  publishers: MagazinePublisherOption[];
  publisherName?: string | null;
  submitLabel: string;
  cancelHref?: string;
};

export default function MagazineForm({
  action,
  magazine,
  publishers,
  publisherName,
  submitLabel,
  cancelHref = "/magazines",
}: MagazineFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 880 }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert severity="success">Magazyn został zapisany.</Alert>
      ) : null}

      {magazine ? (
        <TextField
          label="Wydawca"
          fullWidth
          value={publisherName || magazine.publisherId}
          disabled
        />
      ) : (
        <FormControl
          fullWidth
          required
          disabled={pending}
          error={Boolean(state.fieldErrors?.publisherId)}
        >
          <InputLabel id="magazine-publisher-label">Wydawca</InputLabel>
          <Select
            labelId="magazine-publisher-label"
            name="publisherId"
            label="Wydawca"
            defaultValue=""
          >
            {publishers.map((publisher) => (
              <MenuItem key={publisher.id} value={publisher.id}>
                {publisher.name}
              </MenuItem>
            ))}
          </Select>
          {state.fieldErrors?.publisherId ? (
            <FormHelperText>{state.fieldErrors.publisherId}</FormHelperText>
          ) : null}
        </FormControl>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="name"
          label="Nazwa"
          required
          fullWidth
          defaultValue={magazine?.name ?? ""}
          error={Boolean(state.fieldErrors?.name)}
          helperText={state.fieldErrors?.name}
          disabled={pending}
        />
        <TextField
          name="shortName"
          label="Nazwa skrócona"
          fullWidth
          defaultValue={magazine?.shortName ?? ""}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="issn"
          label="ISSN"
          fullWidth
          defaultValue={magazine?.issn ?? ""}
          disabled={pending}
        />
        <TextField
          name="eissn"
          label="eISSN"
          fullWidth
          defaultValue={magazine?.eissn ?? ""}
          disabled={pending}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="magazine-frequency-label">Częstotliwość</InputLabel>
          <Select
            labelId="magazine-frequency-label"
            name="frequency"
            label="Częstotliwość"
            defaultValue={magazine?.frequency ?? ""}
          >
            <MenuItem value="">—</MenuItem>
            {MAGAZINE_FREQUENCIES.map((frequency) => (
              <MenuItem key={frequency} value={frequency}>
                {MAGAZINE_FREQUENCY_LABELS[frequency]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          name="language"
          label="Język"
          fullWidth
          defaultValue={magazine?.language ?? ""}
          disabled={pending}
          placeholder="np. pl"
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          name="pageFormat"
          label="Format strony"
          fullWidth
          defaultValue={magazine?.pageFormat ?? ""}
          disabled={pending}
          placeholder="np. A4"
        />
        <TextField
          name="defaultPageCount"
          label="Domyślna liczba stron"
          type="number"
          fullWidth
          defaultValue={
            magazine?.defaultPageCount != null
              ? String(magazine.defaultPageCount)
              : ""
          }
          error={Boolean(state.fieldErrors?.defaultPageCount)}
          helperText={state.fieldErrors?.defaultPageCount}
          disabled={pending}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
      </Stack>

      <TextField
        name="description"
        label="Opis"
        fullWidth
        multiline
        minRows={2}
        defaultValue={magazine?.description ?? ""}
        disabled={pending}
      />

      <TextField
        name="notes"
        label="Notatki"
        fullWidth
        multiline
        minRows={2}
        defaultValue={magazine?.notes ?? ""}
        disabled={pending}
      />

      {magazine ? (
        <FormControl fullWidth disabled={pending}>
          <InputLabel id="magazine-active-label">Status</InputLabel>
          <Select
            labelId="magazine-active-label"
            name="active"
            label="Status"
            defaultValue={magazine.active ? "true" : "false"}
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
