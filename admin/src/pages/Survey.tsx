import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SURVEY_ORDER } from "../graphql/queries";
import { SUBMIT_SURVEY } from "../graphql/mutations";
import BrandLogo from "../components/BrandLogo";
import { inr } from "../components/ui";

interface SurveyItem {
  name: string;
  price: number;
  qty: number;
}
interface ItemRating {
  name: string;
  rating: number;
}
interface SurveyOrder {
  orderNumber: string;
  customerName?: string | null;
  total: number;
  status: string;
  alreadyRated: boolean;
  canRate: boolean;
  items: SurveyItem[];
  rating?: { food: number; delivery: number; comment?: string; items?: ItemRating[] } | null;
}

const SERVER_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/graphql").replace(/\/graphql$/, "");

function Centered({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "grid", placeItems: "center", p: 3 }}>
      {children}
    </Box>
  );
}

function StarRow({ label, value, onChange }: Readonly<{ label: string; value: number | null; onChange?: (v: number | null) => void }>) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography>{label}</Typography>
      <Rating value={value} readOnly={!onChange} onChange={(_, v) => onChange?.(v)} size="large" />
    </Stack>
  );
}

function ThankYou({ rating }: Readonly<{ rating?: SurveyOrder["rating"] }>) {
  if (!rating) {
    return <Typography variant="h6" fontWeight={800}>Thank you for your feedback! 🎉</Typography>;
  }
  const perItem = rating.items ?? [];
  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" fontWeight={800}>Thank you for your feedback! 🎉</Typography>
      {perItem.length > 0
        ? perItem.map((r) => <StarRow key={r.name} label={r.name} value={r.rating} />)
        : <StarRow label="Food" value={rating.food} />}
      <Divider />
      <StarRow label="Delivery" value={rating.delivery} />
      {rating.comment ? <Typography color="text.secondary">“{rating.comment}”</Typography> : null}
    </Stack>
  );
}

export default function Survey() {
  const { orderId = "", token = "" } = useParams();
  const { data, loading, error } = useQuery<{ surveyOrder: SurveyOrder | null }>(SURVEY_ORDER, {
    variables: { orderId, token },
    fetchPolicy: "network-only",
  });
  const [submit, { loading: submitting }] = useMutation(SUBMIT_SURVEY);

  const [itemStars, setItemStars] = useState<Record<number, number | null>>({});
  const [delivery, setDelivery] = useState<number | null>(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");

  const order = data?.surveyOrder;

  async function onSubmit() {
    setFormError("");
    if (!order) return;
    if (order.items.some((_, i) => !itemStars[i])) {
      setFormError("Please give every item a star rating.");
      return;
    }
    if (!delivery) {
      setFormError("Please rate the delivery.");
      return;
    }
    const itemRatings = order.items.map((it, i) => ({ name: it.name, rating: itemStars[i] as number }));
    try {
      await submit({ variables: { orderId, token, itemRatings, delivery, comment: comment.trim() || null } });
      setDone(true);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Couldn't submit — please try again.");
    }
  }

  if (loading) {
    return <Centered><CircularProgress color="primary" /></Centered>;
  }
  if (error || !order) {
    return <Centered><Typography variant="h6">This survey link is invalid or has expired.</Typography></Centered>;
  }

  let ratingSection: ReactNode;
  if (done || order.alreadyRated) {
    ratingSection = <ThankYou rating={order.rating} />;
  } else if (order.canRate) {
    ratingSection = (
      <Stack spacing={2}>
        <Typography fontWeight={700}>Rate each item</Typography>
        {order.items.map((it, i) => (
          <StarRow
            key={`${it.name}-${it.price}-${it.qty}`}
            label={`${it.qty}× ${it.name}`}
            value={itemStars[i] ?? 0}
            onChange={(v) => setItemStars((m) => ({ ...m, [i]: v }))}
          />
        ))}
        <Divider />
        <StarRow label="Delivery experience" value={delivery} onChange={setDelivery} />
        <TextField label="Anything else? (optional)" multiline minRows={3} value={comment} onChange={(e) => setComment(e.target.value)} fullWidth />
        {formError ? <Typography color="error" variant="body2">{formError}</Typography> : null}
        <Button variant="contained" size="large" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit feedback"}
        </Button>
      </Stack>
    );
  } else {
    ratingSection = <Typography color="text.secondary">You can leave a rating once this order has been delivered.</Typography>;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="sm">
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <BrandLogo size={64} />
          <Typography variant="h5" fontWeight={800}>How was your order?</Typography>
          <Typography color="text.secondary" textAlign="center">
            {order.customerName ? `Hi ${order.customerName}, ` : ""}order {order.orderNumber}
          </Typography>
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={700} gutterBottom>Your order</Typography>
            <Stack spacing={0.5}>
              {order.items.map((it) => (
                <Stack key={`${it.name}-${it.qty}-${it.price}`} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{it.qty}× {it.name}</Typography>
                  <Typography variant="body2">{inr(it.price * it.qty)}</Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={800}>Total</Typography>
              <Typography fontWeight={800} color="primary">{inr(order.total)}</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>{ratingSection}</CardContent>
        </Card>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button variant="outlined" href={`${SERVER_BASE}/invoice/${orderId}/${token}`} target="_blank" rel="noreferrer">
            ⬇ Download receipt (PDF)
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
