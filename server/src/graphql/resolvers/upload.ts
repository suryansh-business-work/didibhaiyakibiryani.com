import { GraphQLError } from "graphql";
import { requireAuth, requireRole, type Context } from "../../utils/auth.js";
import { uploadToImageKit, imagekitConfigured } from "../../utils/imagekit.js";

interface UploadArgs {
  file: string;
  fileName: string;
  folder?: string;
}

// ~10 MB of base64 (≈7.5 MB binary) — matches the GraphQL body limit.
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

async function doUpload(args: UploadArgs): Promise<{ url: string; fileId: string }> {
  if (!(await imagekitConfigured())) {
    throw new GraphQLError("Image upload is not configured on the server.", {
      extensions: { code: "FAILED_PRECONDITION" },
    });
  }
  if (!args.file || args.file.length > MAX_BASE64_LENGTH) {
    throw new GraphQLError("Image is missing or larger than the 7 MB limit.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  try {
    return await uploadToImageKit(args);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image upload failed.";
    throw new GraphQLError(message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
  }
}

export const uploadResolvers = {
  Mutation: {
    uploadImage: async (_: unknown, args: UploadArgs, ctx: Context) => {
      requireRole(ctx, "ADMIN");
      return doUpload(args);
    },

    /** Customers attach issue photos to support tickets (locked to /support). */
    uploadSupportImage: async (
      _: unknown,
      args: Omit<UploadArgs, "folder">,
      ctx: Context
    ) => {
      requireAuth(ctx);
      return doUpload({ ...args, folder: "/support" });
    },
  },
};
