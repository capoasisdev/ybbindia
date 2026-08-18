import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain: publicDomain ? publicDomain.replace(/\/+$/, "") : undefined,
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

export function buildPublicUrl(key: string, config: R2Config): string {
  if (config.publicDomain) {
    const cleanDomain = config.publicDomain.replace(/\/+$/, "");
    const cleanKey = key.replace(/^\/+/, "");
    return `${cleanDomain}/${encodeURI(cleanKey)}`;
  }
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${encodeURI(key)}`;
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
  const files: R2Item[] = (response.Contents ?? [])
    .filter((item) => {
      const key = item.Key ?? "";
      // Exclude folder marker itself or subfolder items
      return key !== cleanPrefix && !key.endsWith("/");
    })
    .map((item) => {
      const key = item.Key ?? "";
      const name = key.slice(cleanPrefix.length);
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      const isVideo = isVideoFile(name);

      return {
        key,
        name,
        size: item.Size ?? 0,
        lastModified: item.LastModified ? item.LastModified.toISOString() : null,
        publicUrl: buildPublicUrl(key, config),
        isFolder: false,
        extension: ext,
        isVideo,
      };
    });

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

export async function generateDownloadPresignedUrl(key: string): Promise<string> {
  const { client, config } = getR2Client();
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: 86400 });
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
