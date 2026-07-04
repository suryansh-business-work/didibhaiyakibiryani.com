import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { Box, Button, Typography } from "@mui/material";
import { UPLOAD_IMAGE } from "../graphql/mutations";
import CropDialog from "./CropDialog";

const MAX_FILE_BYTES = 7 * 1024 * 1024; // matches the server-side limit

interface ImageUploadProps {
  /** ImageKit folder, e.g. "/menu" or "/branding" */
  folder: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
  /** File picker accept filter. Defaults to images; pass e.g. "image/*,application/pdf" for invoices. */
  accept?: string;
  /** Crop box aspect ratio for the crop dialog (images only). Default 1 (square). */
  cropAspect?: number;
}

const IMAGE_URL_RE = /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

/** Picks a local image and uploads it to ImageKit via the server. */
export default function ImageUpload({ folder, currentUrl, onUploaded, label = "Image", accept = "image/*", cropAspect = 1 }: Readonly<ImageUploadProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, { loading }] = useMutation(UPLOAD_IMAGE);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [fileName, setFileName] = useState("image.jpg");
  const imagesOnly = accept === "image/*";

  async function doUpload(dataUrl: string, name: string) {
    const { data } = await upload({ variables: { file: dataUrl, fileName: name, folder } });
    onUploaded(data.uploadImage.url);
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (imagesOnly && !file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File must be under 7 MB.");
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      // Images go through the crop dialog first; PDFs upload as-is.
      if (imagesOnly) {
        setFileName(file.name);
        setCropSrc(dataUrl);
      } else {
        await doUpload(dataUrl, file.name);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed — please try again.");
    }
  }

  async function onCropped(dataUrl: string) {
    setCropSrc("");
    try {
      await doUpload(dataUrl, fileName);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed — please try again.");
    }
  }

  const showImagePreview = Boolean(currentUrl) && (imagesOnly || IMAGE_URL_RE.test(currentUrl ?? ""));
  const caption = imagesOnly ? "JPG / PNG / WebP · max 7 MB · served via ImageKit CDN" : "Image or PDF · max 7 MB · served via ImageKit CDN";

  function preview() {
    if (showImagePreview) {
      return <Box component="img" src={currentUrl} alt="" sx={{ width: 72, height: 72, borderRadius: 1.5, objectFit: "cover", border: 1, borderColor: "divider" }} />;
    }
    if (currentUrl) {
      return (
        <Box sx={{ width: 72, height: 72, borderRadius: 1.5, display: "grid", placeItems: "center", border: 1, borderColor: "divider" }}>
          <Button size="small" href={currentUrl} target="_blank" rel="noreferrer">View</Button>
        </Box>
      );
    }
    return (
      <Box sx={{ width: 72, height: 72, borderRadius: 1.5, display: "grid", placeItems: "center", border: 1, borderColor: "divider", color: "text.secondary", fontSize: "0.7rem" }}>
        No file
      </Box>
    );
  }

  return (
    <Box sx={{ my: 1.5 }}>
      <Typography variant="body2" fontWeight={700} color="text.secondary" gutterBottom>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {preview()}
        <Box>
          <Button variant="outlined" size="small" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? "Uploading…" : "Upload"}
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
            {caption}
          </Typography>
        </Box>
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const el = e.currentTarget;
          onPick(el.files?.[0]);
          el.value = "";
        }}
      />
      {error ? <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>{error}</Typography> : null}
      <CropDialog open={Boolean(cropSrc)} imageSrc={cropSrc} aspect={cropAspect} onCancel={() => setCropSrc("")} onCropped={onCropped} />
    </Box>
  );
}
