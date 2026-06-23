import { useQuery } from "@apollo/client";
import { Avatar, Box } from "@mui/material";
import { SETTINGS } from "../graphql/queries";

/** Brand logo from admin settings; falls back to the maroon badge until a
 * logo is uploaded under Branding. Shares the cached `settings` query. */
export default function BrandLogo({ size = 40 }: Readonly<{ size?: number }>) {
  const { data } = useQuery<{ settings?: { logoUrl?: string; brandName?: string } }>(SETTINGS);
  const logoUrl = data?.settings?.logoUrl;
  if (logoUrl) {
    return <Avatar src={logoUrl} alt={data?.settings?.brandName ?? "Logo"} sx={{ width: size, height: size }} />;
  }
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: "primary.main",
        background: "radial-gradient(circle at 50% 35%, #7a2a1c, #3a0f0c)",
        flexShrink: 0,
      }}
    />
  );
}
