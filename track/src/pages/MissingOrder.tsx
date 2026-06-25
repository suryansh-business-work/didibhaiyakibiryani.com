import { Box, Card, CardContent, Typography } from "@mui/material";

export default function MissingOrder() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            No order number
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open the tracking link from your order confirmation to follow your
            delivery. The link ends with your order number.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
