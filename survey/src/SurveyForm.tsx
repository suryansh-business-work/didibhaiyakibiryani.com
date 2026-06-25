import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Button, Card, CardContent, Divider, Stack, TextField, Typography } from "@mui/material";
import { SUBMIT_ORDER_SURVEY, type SurveyItem } from "./graphql";
import { StarRow } from "./components";

interface Props {
  orderNumber: string;
  items: SurveyItem[];
  onDone: () => void;
}

/** The interactive rating form: a star row per item + delivery + comment. */
export default function SurveyForm({ orderNumber, items, onDone }: Readonly<Props>) {
  const [submit, { loading }] = useMutation(SUBMIT_ORDER_SURVEY);
  const [itemStars, setItemStars] = useState<Record<number, number | null>>({});
  const [delivery, setDelivery] = useState<number | null>(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");

  const setItem = (i: number, v: number | null) =>
    setItemStars((m) => ({ ...m, [i]: v }));

  async function onSubmit() {
    setFormError("");
    if (items.some((_, i) => !itemStars[i])) {
      setFormError("Please give every item a star rating.");
      return;
    }
    if (!delivery) {
      setFormError("Please rate the delivery experience.");
      return;
    }
    const itemRatings = items.map((it, i) => ({ name: it.name, rating: itemStars[i] as number }));
    try {
      await submit({
        variables: { orderNumber, itemRatings, delivery, comment: comment.trim() || null },
      });
      onDone();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Couldn't submit — please try again.");
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography fontWeight={700}>Rate each item</Typography>
          {items.map((it, i) => (
            <StarRow
              key={`${it.name}-${it.qty}-${it.price}`}
              label={`${it.qty}× ${it.name}`}
              value={itemStars[i] ?? 0}
              onChange={(v) => setItem(i, v)}
            />
          ))}
          <Divider />
          <StarRow label="Delivery experience" value={delivery} onChange={setDelivery} />
          <TextField
            label="Anything else? (optional)"
            multiline
            minRows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
          />
          {formError ? (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          ) : null}
          <Button variant="contained" size="large" onClick={onSubmit} disabled={loading}>
            {loading ? "Submitting…" : "Submit feedback"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
