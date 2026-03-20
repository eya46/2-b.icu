import * as openpgp from "openpgp";
import type { GithubGpgKeyOption, GithubGpgLookupResponse } from "~/types/github-gpg";

interface GithubApiGpgKey {
  raw_key: string;
  revoked: boolean;
}

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37})$/i;

const githubRequestHeaders = {
  accept: "application/vnd.github+json",
  "user-agent": "2-b.icu",
  "x-github-api-version": "2022-11-28",
};

const toUpperHex = (value: string) => value.toUpperCase();

const getIsoDate = (value: Date | typeof Infinity | null) => {
  if (!(value instanceof Date)) {
    return null;
  }

  return value.toISOString();
};

const mapGithubKey = async (githubKey: GithubApiGpgKey): Promise<GithubGpgKeyOption | null> => {
  if (!githubKey.raw_key) {
    return null;
  }

  const parsedKey = await openpgp.readKey({
    armoredKey: githubKey.raw_key,
  });

  const revoked = githubKey.revoked || await parsedKey.isRevoked().catch(() => false);
  if (revoked) {
    return null;
  }

  let encryptionKey: openpgp.Key | openpgp.Subkey;
  try {
    encryptionKey = await parsedKey.getEncryptionKey();
  } catch {
    return null;
  }

  const algorithmInfo = parsedKey.getAlgorithmInfo();
  const userIds = parsedKey.getUserIDs();
  const expirationTime = await parsedKey.getExpirationTime().catch(() => null);

  return {
    keyId: toUpperHex(parsedKey.getKeyID().toHex()),
    encryptionKeyId: toUpperHex(encryptionKey.getKeyID().toHex()),
    fingerprint: toUpperHex(parsedKey.getFingerprint()),
    userIds,
    primaryUserId: userIds[0] ?? null,
    algorithm: algorithmInfo.algorithm,
    curve: algorithmInfo.curve ?? null,
    bits: algorithmInfo.bits ?? null,
    createdAt: parsedKey.getCreationTime().toISOString(),
    expiresAt: getIsoDate(expirationTime),
    rawKey: githubKey.raw_key,
  };
};

export default defineEventHandler(async (event): Promise<GithubGpgLookupResponse> => {
  const username = getRouterParam(event, "username")?.trim() ?? "";
  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: "请输入 GitHub 用户名",
    });
  }

  if (!GITHUB_USERNAME_PATTERN.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: "GitHub 用户名格式无效",
    });
  }

  let githubKeys: GithubApiGpgKey[];
  try {
    githubKeys = await $fetch<GithubApiGpgKey[]>(
      `https://api.github.com/users/${encodeURIComponent(username)}/gpg_keys`,
      {
        headers: githubRequestHeaders,
      },
    );
  } catch (error) {
    const statusCode = typeof error === "object" && error && "response" in error
      ? (error.response as { status?: number } | undefined)?.status
      : undefined;

    if (statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: "GitHub 用户不存在",
      });
    }

    if (statusCode === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: "GitHub API 访问受限，请稍后重试",
      });
    }

    throw createError({
      statusCode: 502,
      statusMessage: "查询 GitHub GPG 公钥失败",
    });
  }

  const parsedKeys = await Promise.all(
    githubKeys.map(async (githubKey) => {
      try {
        return await mapGithubKey(githubKey);
      } catch {
        return null;
      }
    }),
  );

  return {
    username,
    keys: parsedKeys.filter((key): key is GithubGpgKeyOption => Boolean(key)),
  };
});
