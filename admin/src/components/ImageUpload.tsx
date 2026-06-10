import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPLOAD_IMAGE } from "../graphql/mutations";

const MAX_FILE_BYTES = 7 * 1024 * 1024; // matches the server-side limit

interface ImageUploadProps {
  /** ImageKit folder, e.g. "/menu" or "/branding" */
  folder: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

/** Picks a local image and uploads it to ImageKit via the server. */
export default function ImageUpload({
  folder,
  currentUrl,
  onUploaded,
  label = "Image",
}: Readonly<ImageUploadProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, { loading }] = useMutation(UPLOAD_IMAGE);
  const [error, setError] = useState("");

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 7 MB.");
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      const { data } = await upload({
        variables: { file: dataUrl, fileName: file.name, folder },
      });
      onUploaded(data.uploadImage.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed — please try again.");
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="upload-row">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="upload-preview" />
        ) : (
          <div className="upload-preview upload-preview--empty">No image</div>
        )}
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? "Uploading…" : "Upload image"}
          </button>
          <div className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>
            JPG / PNG / WebP · max 7 MB · served via ImageKit CDN
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
