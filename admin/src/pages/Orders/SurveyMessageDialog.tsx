import { useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SETTINGS } from "../../graphql/queries";
import type { Order } from "./types";

/** Intro line, dynamic by order status. */
const STATUS_INTRO: Record<string, string> = {
  DELIVERED:
    "We hope you enjoyed your meal. We would greatly appreciate it if you could take a moment to share your feedback and rate your experience using the link below:",
  OUT_FOR_DELIVERY:
    "Your order is out for delivery and will reach you shortly. Once it arrives, we'd love your feedback using the link below:",
  PREPARING:
    "Your order is being freshly prepared. After you've enjoyed it, please share your feedback using the link below:",
  CONFIRMED:
    "Your order has been confirmed and will be prepared soon. Afterwards, we'd love your feedback using the link below:",
  PLACED: "We've received your order. Once it's delivered, we'd love your feedback using the link below:",
  CANCELLED: "We're sorry your order was cancelled. We'd still value your feedback using the link below:",
};

function buildMessage(o: Order, brandName: string, website: string): string {
  const name = o.user?.name ?? o.customerName ?? "there";
  const surveyLink = o.ratingToken ? `${window.location.origin}/survey/${o.id}/${o.ratingToken}` : "";
  const intro = STATUS_INTRO[o.status] ?? STATUS_INTRO.PLACED;
  return `Hi ${name},

Greetings from ${brandName}!

${intro}

${surveyLink}

Your feedback helps us improve and serve you better. If you have any upcoming orders or special requirements, please feel free to let us know.

Thank you for choosing ${brandName}. We look forward to serving you again!

Best Regards,
Team ${brandName} 🍛🙏
Website: ${website}
Receipt no: ${o.orderNumber}`;
}

interface Props {
  order: Order;
  onClose: () => void;
}

export default function SurveyMessageDialog({ order, onClose }: Readonly<Props>) {
  const { data } = useQuery<{ settings?: { brandName?: string; website?: string } }>(SETTINGS);
  const brandName = data?.settings?.brandName || "Didi Bhaiya ki Biryani";
  const website = data?.settings?.website || "didibhaiyakibiryani.com";
  const message = useMemo(() => buildMessage(order, brandName, website), [order, brandName, website]);
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = ref.current?.innerText ?? message;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Survey message — {order.orderNumber}
        <IconButton size="small" onClick={onClose} aria-label="Close"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Edit if you like, then copy and send it to the customer.
        </Typography>
        <Box
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          sx={{
            whiteSpace: "pre-wrap",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
            minHeight: 260,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            outline: "none",
            "&:focus": { borderColor: "primary.main" },
          }}
        >
          {message}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={copy}>{copied ? "Copied!" : "Copy message"}</Button>
      </DialogActions>
    </Dialog>
  );
}
