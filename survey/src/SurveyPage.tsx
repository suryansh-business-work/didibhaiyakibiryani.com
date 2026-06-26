import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import { SURVEY_ORDER, type SurveyOrder } from "./graphql";
import { Centered, SurveyShell } from "./components";
import OrderSummary from "./OrderSummary";
import SurveyForm from "./SurveyForm";
import { NotYetState, ThankYouState } from "./SurveyStates";

export default function SurveyPage() {
  const { orderNumber = "" } = useParams();
  const { data, loading, error } = useQuery<{ surveyOrder: SurveyOrder | null }>(SURVEY_ORDER, {
    variables: { orderNumber },
    fetchPolicy: "network-only",
  });
  const [done, setDone] = useState(false);

  if (loading) {
    return (
      <Centered>
        <CircularProgress color="primary" />
      </Centered>
    );
  }

  const order = data?.surveyOrder;
  if (error || !order) {
    return (
      <Centered>
        <Alert severity="error" variant="outlined">
          This survey link is invalid.
        </Alert>
      </Centered>
    );
  }

  const subtitle = order.customerName
    ? `Hi ${order.customerName}, order ${order.orderNumber}`
    : `Order ${order.orderNumber}`;

  return (
    <SurveyShell subtitle={subtitle}>
      <Stack spacing={2}>
        <OrderSummary
          items={order.items}
          subtotal={order.subtotal}
          discount={order.discount}
          deliveryFee={order.deliveryFee}
          total={order.total}
          receiptUrl={order.receiptUrl}
        />
        <SurveyBody order={order} done={done} onDone={() => setDone(true)} />
      </Stack>
    </SurveyShell>
  );
}

function SurveyBody({
  order,
  done,
  onDone,
}: Readonly<{ order: SurveyOrder; done: boolean; onDone: () => void }>) {
  if (done || order.alreadyRated) {
    return <ThankYouState rating={order.rating} />;
  }
  if (!order.canRate) {
    return (
      <Stack spacing={2}>
        <NotYetState />
        <Typography color="text.secondary" textAlign="center" variant="body2">
          Come back to this link after delivery to share your rating.
        </Typography>
      </Stack>
    );
  }
  return <SurveyForm orderNumber={order.orderNumber} items={order.items} onDone={onDone} />;
}
