import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs";
import path from "node:path";

function readEnvFile(): Record<string, string> {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, "utf8");
    const result: Record<string, string> = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (!val.startsWith('"') && !val.startsWith("'")) {
        const hashIdx = val.indexOf("#");
        if (hashIdx !== -1) val = val.slice(0, hashIdx).trim();
      } else if (val.startsWith('"')) {
        const endQuote = val.indexOf('"', 1);
        if (endQuote !== -1) val = val.slice(1, endQuote);
      } else if (val.startsWith("'")) {
        const endQuote = val.indexOf("'", 1);
        if (endQuote !== -1) val = val.slice(1, endQuote);
      }
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain?: string;
};

export type R2Item = {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
  publicUrl: string;
  previewUrl: string;
  isFolder: boolean;
  contentType?: string;
  extension: string;
  isVideo: boolean;
};

export type R2FolderListing = {
  currentPrefix: string;
  folders: {
    prefix: string;
    name: string;
  }[];
  files: R2Item[];
  isConfigured: boolean;
  bucketName: string | null;
  publicDomain: string | null;
};

export function getR2Config(): R2Config | null {
  const fileEnv = readEnvFile();

  const accountId = (
    fileEnv.R2_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    fileEnv.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID
  )?.trim();

  const accessKeyId = (
    fileEnv.R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    fileEnv.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  )?.trim();

  const secretAccessKey = (
    fileEnv.R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    fileEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  )?.trim();

  const bucketName = (
    fileEnv.R2_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    fileEnv.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME
  )?.trim();

  let publicDomain = (
    fileEnv.R2_PUBLIC_DOMAIN ||
    process.env.R2_PUBLIC_DOMAIN ||
    fileEnv.CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN
  )?.trim();

  if (publicDomain) {
    // Strip surrounding quotes
    publicDomain = publicDomain.replace(/^["']|["']$/g, "").trim();
    // Strip trailing slashes
    publicDomain = publicDomain.replace(/\/+$/, "");
    // Ensure protocol
    if (publicDomain && !publicDomain.startsWith("http://") && !publicDomain.startsWith("https://")) {
      publicDomain = `https://${publicDomain}`;
    }
  }

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain: publicDomain || undefined,
  };
}

let cachedS3Client: S3Client | null = null;
let cachedConfigKey = "";

export function getR2Client(): { client: S3Client; config: R2Config } {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      "Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your environment variables.",
    );
  }

  const configKey = `${config.accountId}:${config.accessKeyId}:${config.bucketName}`;
  if (!cachedS3Client || cachedConfigKey !== configKey) {
    cachedS3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    cachedConfigKey = configKey;
  }

  return { client: cachedS3Client, config };
}

export function isPublicWebDomain(domain?: string): boolean {
  if (!domain) return false;
  // If it's the internal S3 API endpoint, it requires AWS SigV4 auth, not open web access
  if (domain.includes(".r2.cloudflarestorage.com")) return false;
  return domain.startsWith("http://") || domain.startsWith("https://");
}

export function buildPublicUrl(key: string, config: R2Config): string {
  const cleanKey = key.replace(/^\/+/, "");
  const encodedKey = cleanKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (config.publicDomain && isPublicWebDomain(config.publicDomain)) {
    const cleanDomain = config.publicDomain.replace(/\/+$/, "");
    return `${cleanDomain}/${encodedKey}`;
  }
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${encodedKey}`;
}

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "mkv", "avi", "flv", "wmv"]);

export function isVideoFile(fileNameOrKey: string): boolean {
  const ext = fileNameOrKey.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.has(ext);
}

export function sanitizePrefix(prefix: string): string {
  let clean = prefix.trim().replace(/^\/+/, "");
  if (clean && !clean.endsWith("/")) {
    clean += "/";
  }
  return clean;
}

export async function generateDownloadPresignedUrl(key: string): Promise<string> {
  const { client, config } = getR2Client();
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });
  // 7-day expiration for streaming preview
  return getSignedUrl(client, command, { expiresIn: 604800 });
}

export async function listR2FolderContents(prefix: string = ""): Promise<R2FolderListing> {
  const config = getR2Config();
  if (!config) {
    return {
      currentPrefix: prefix,
      folders: [],
      files: [],
      isConfigured: false,
      bucketName: null,
      publicDomain: null,
    };
  }

  const { client } = getR2Client();
  const cleanPrefix = sanitizePrefix(prefix);

  const command = new ListObjectsV2Command({
    Bucket: config.bucketName,
    Prefix: cleanPrefix,
    Delimiter: "/",
  });

  const response = await client.send(command);

  // Subfolders from CommonPrefixes
  const folders = (response.CommonPrefixes ?? [])
    .map((cp) => {
      const fullPrefix = cp.Prefix ?? "";
      // Strip parent prefix to get folder name
      const relative = fullPrefix.slice(cleanPrefix.length).replace(/\/$/, "");
      return {
        prefix: fullPrefix,
        name: relative,
      };
    })
    .filter((f) => Boolean(f.name));

  // Files from Contents
  const rawFiles = (response.Contents ?? []).filter((item) => {
    const key = item.Key ?? "";
    return key !== cleanPrefix && !key.endsWith("/");
  });

  // Generate signed preview URLs in parallel so videos stream immediately
  const files: R2Item[] = await Promise.all(
    rawFiles.map(async (item) => {
      const key = item.Key ?? "";
      const name = key.slice(cleanPrefix.length);
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      const isVideo = isVideoFile(name);
      const previewUrl = await generateDownloadPresignedUrl(key);

      return {
        key,
        name,
        size: item.Size ?? 0,
        lastModified: item.LastModified ? item.LastModified.toISOString() : null,
        publicUrl: buildPublicUrl(key, config),
        previewUrl,
        isFolder: false,
        extension: ext,
        isVideo,
      };
    }),
  );

  return {
    currentPrefix: cleanPrefix,
    folders,
    files,
    isConfigured: true,
    bucketName: config.bucketName,
    publicDomain: config.publicDomain ?? null,
  };
}

export async function createFolderInR2(
  parentPrefix: string,
  folderName: string,
): Promise<{ folderPrefix: string }> {
  const { client, config } = getR2Client();
  const cleanParent = sanitizePrefix(parentPrefix);
  const cleanName = folderName
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/^\.+/, "");

  if (!cleanName) {
    throw new Error("Folder name cannot be empty");
  }

  const folderPrefix = `${cleanParent}${cleanName}/`;

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: folderPrefix,
    Body: "",
    ContentLength: 0,
  });

  await client.send(command);
  return { folderPrefix };
}

export async function generateUploadPresignedUrl(
  folderPrefix: string,
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const { client, config } = getR2Client();
  const cleanPrefix = sanitizePrefix(folderPrefix);
  const cleanFileName = fileName.trim().replace(/[\\/]+/g, "_");

  if (!cleanFileName) {
    throw new Error("File name cannot be empty");
  }

  const key = `${cleanPrefix}${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = buildPublicUrl(key, config);

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

export async function deleteFileFromR2(key: string): Promise<{ ok: boolean }> {
  const { client, config } = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });
  await client.send(command);
  return { ok: true };
}

export async function deleteFolderFromR2(
  folderPrefix: string,
): Promise<{ ok: boolean; deletedCount: number }> {
  const { client, config } = getR2Client();
  const cleanPrefix = sanitizePrefix(folderPrefix);

  if (!cleanPrefix) {
    throw new Error("Cannot delete root bucket directory");
  }

  // List all objects with this prefix recursively
  const listCommand = new ListObjectsV2Command({
    Bucket: config.bucketName,
    Prefix: cleanPrefix,
  });

  const response = await client.send(listCommand);
  const objectsToDelete = (response.Contents ?? [])
    .map((item) => ({ Key: item.Key }))
    .filter((item): item is { Key: string } => Boolean(item.Key));

  if (objectsToDelete.length > 0) {
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });
    await client.send(deleteCommand);
  }

  return { ok: true, deletedCount: objectsToDelete.length };
}

export async function configureR2Cors(
  allowedOrigins: string[] = ["*"],
): Promise<{ success: boolean; message: string }> {
  const { client, config } = getR2Client();
  const command = new PutBucketCorsCommand({
    Bucket: config.bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
          AllowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : ["*"],
          ExposeHeaders: ["ETag", "Content-Type", "Content-Length"],
          MaxAgeSeconds: 86400,
        },
      ],
    },
  });

  await client.send(command);
  return {
    success: true,
    message: `CORS policy successfully configured for bucket "${config.bucketName}".`,
  };
}

export async function checkR2Cors(): Promise<{ isCorsConfigured: boolean; rules?: any[] }> {
  const { client, config } = getR2Client();
  try {
    const command = new GetBucketCorsCommand({
      Bucket: config.bucketName,
    });
    const res = await client.send(command);
    return {
      isCorsConfigured: (res.CORSRules?.length ?? 0) > 0,
      rules: res.CORSRules,
    };
  } catch (err: any) {
    if (err.name === "NoSuchCORSConfiguration") {
      return { isCorsConfigured: false, rules: [] };
    }
    return { isCorsConfigured: false, rules: [] };
  }
}

