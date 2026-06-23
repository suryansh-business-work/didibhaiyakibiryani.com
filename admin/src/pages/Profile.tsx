import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import Layout from "../components/Layout";
import { Spinner } from "../components/ui";
import { ME } from "../graphql/queries";
import { UPDATE_PROFILE } from "../graphql/mutations";
import { useAuth } from "../auth";
import { RHFField, profileSchema, type ProfileForm } from "../form";

interface Me {
  id: string; name: string; email: string; phone?: string; role: string;
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function Profile() {
  const { refresh } = useAuth();
  const { data, loading } = useQuery<{ me: Me }>(ME, { fetchPolicy: "network-only" });
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [saved, setSaved] = useState(false);
  const {
    control, handleSubmit, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { name: "", phone: "" } });

  const me = data?.me;
  useEffect(() => {
    if (me) reset({ name: me.name, phone: me.phone ?? "" });
  }, [me, reset]);

  async function onSave(form: ProfileForm) {
    setSaved(false);
    try {
      await updateProfile({ variables: { name: form.name.trim(), phone: form.phone?.trim() || null } });
      await refresh();
      setSaved(true);
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  if (loading && !me) {
    return (
      <Layout title="Profile">
        <Spinner label="Loading…" />
      </Layout>
    );
  }

  return (
    <Layout title="Profile">
      <Paper sx={{ maxWidth: 560, p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "#1a1206", fontWeight: 800, fontSize: "1.4rem" }}>{initials(me?.name)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>{me?.name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{me?.email}</Typography>
            <Chip size="small" label={me?.role} color="primary" variant="outlined" sx={{ mt: 0.5 }} />
          </Box>
        </Stack>

        <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
        <RHFField control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Email is your login id and can't be changed here.
        </Typography>

        {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1.5 }}>{errors.root.message}</Typography> : null}
        {saved ? <Typography color="success.main" variant="body2" sx={{ mt: 1.5 }}>Profile updated.</Typography> : null}

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleSubmit(onSave)} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Paper>
    </Layout>
  );
}
