import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Slider, Typography } from "@mui/material";
import { getCroppedImg } from "./cropImage";

interface CropDialogProps {
  open: boolean;
  imageSrc: string;
  /** Crop box aspect ratio (width / height), e.g. 1 for square, 16/9 for banners. */
  aspect: number;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
}

/** Modal image cropper (react-easy-crop) with a zoom slider. Returns the
 *  cropped region as a JPEG data URL for uploading. */
export default function CropDialog({ open, imageSrc, aspect, onCancel, onCropped }: Readonly<CropDialogProps>) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_area: Area, pixels: Area) => setAreaPixels(pixels), []);

  async function confirm() {
    if (!areaPixels) {
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await getCroppedImg(imageSrc, areaPixels);
      onCropped(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Crop image</DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative", width: "100%", height: 360, bgcolor: "#000", borderRadius: 1, overflow: "hidden" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, mb: 0.5, display: "block" }}>
          Drag to reposition · pinch or use the slider to zoom
        </Typography>
        <Slider value={zoom} min={1} max={3} step={0.05} onChange={(_e, v) => setZoom(v as number)} aria-label="Zoom" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button onClick={confirm} variant="contained" disabled={busy || !areaPixels}>
          {busy ? "Processing…" : "Crop & upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
