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
import { DEFAULT_SURVEY_TEMPLATE, fillSurveyTemplate } from "../../constants/surveyTemplate";
import type { Order } from "./types";

interface Props {
  order: Order;
  onClose: () => void;
}

export default function SurveyMessageDialog({ order, onClose }: Readonly<Props>) {
  const { data } = useQuery<{ settings?: { brandName?: string; website?: string; surveyMessageTemplate?: string } }>(SETTINGS);
  const brandName = data?.settings?.brandName || "Didi Bhaiya ki Biryani";
  const website = data?.settings?.website || "didibhaiyakibiryani.com";
  const template = data?.settings?.surveyMessageTemplate || DEFAULT_SURVEY_TEMPLATE;

  const message = useMemo(
    () =>
      fillSurveyTemplate(template, {
        name: order.user?.name ?? order.customerName ?? "there",
        surveyLink: order.ratingUrl ?? "",
        orderNumber: order.orderNumber,
        brandName,
        website,
      }),
    [order, brandName, website, template]
  );

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
          Edit if you like, then copy and send it to the customer. Manage the template under Survey Message.
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
