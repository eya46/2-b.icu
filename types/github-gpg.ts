export interface GithubGpgKeyOption {
  keyId: string;
  encryptionKeyId: string;
  fingerprint: string;
  userIds: string[];
  primaryUserId: string | null;
  algorithm: string;
  curve: string | null;
  bits: number | null;
  createdAt: string | null;
  expiresAt: string | null;
  rawKey: string;
}

export interface GithubGpgLookupResponse {
  username: string;
  keys: GithubGpgKeyOption[];
}
