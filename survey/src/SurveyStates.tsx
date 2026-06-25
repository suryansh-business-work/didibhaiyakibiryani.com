import { Alert, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { SurveyRating } from "./graphql";
import { StarRow } from "./components";

/** Shown after a rating exists (just submitted, or recorded earlier). */
export function ThankYouState({ rating }: Readonly<{ rating?: SurveyRating | null }>) {
  const perItem = rating?.items ?? [];
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6" fontWeight={800}>
            Thank you! Your rating is recorded.
          </Typography>
          {rating ? (
            <RecordedStars rating={rating} perItem={perItem} />
          ) : (
            <Typography color="text.secondary">
              We appreciate you taking the time to share your feedback.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function RecordedStars({
  rating,
  perItem,
}: Readonly<{ rating: SurveyRating; perItem: SurveyRating["items"] }>) {
  const items = perItem ?? [];
  return (
    <>
      {items.length > 0 ? (
        items.map((r) => <StarRow key={r.name} label={r.name} value={r.rating} />)
      ) : (
        <StarRow label="Food" value={rating.food} />
      )}
      <Divider />
      <StarRow label="Delivery" value={rating.delivery} />
      {rating.comment ? (
        <Typography color="text.secondary">“{rating.comment}”</Typography>
      ) : null}
    </>
  );
}

/** Shown when the order isn't delivered yet, so it can't be rated. */
export function NotYetState() {
  return (
    <Alert severity="info" variant="outlined">
      You can rate once your order is delivered.
    </Alert>
  );
}
