import { Alert } from "@mui/material";
import { Centered } from "./components";

/** Landing on "/" with no order number — there's nothing to rate. */
export default function MissingOrder() {
  return (
    <Centered>
      <Alert severity="warning" variant="outlined">
        No order number in the link. Please open the rating link from your order confirmation.
      </Alert>
    </Centered>
  );
}
