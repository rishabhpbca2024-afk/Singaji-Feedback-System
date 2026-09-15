const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getEncryptionKey = () => {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is missing"
    );
  }

  const encryptionKey = Buffer.from(key, "base64");

  if (encryptionKey.length !== KEY_LENGTH) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a 32-byte base64 key"
    );
  }

  return encryptionKey;
};

// ==========================================
// ENCRYPT TOKEN
// ==========================================

const encryptToken = (token) => {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]).toString("base64url");
};

// ==========================================
// DECRYPT TOKEN
// ==========================================

const decryptToken = (encryptedToken) => {
  const key = getEncryptionKey();

  const data = Buffer.from(
    encryptedToken,
    "base64url"
  );

  const minimumLength =
    IV_LENGTH + AUTH_TAG_LENGTH + 1;

  if (data.length < minimumLength) {
    throw new Error("Invalid encrypted token");
  }

  const iv = data.subarray(0, IV_LENGTH);

  const authTag = data.subarray(
    IV_LENGTH,
    IV_LENGTH + AUTH_TAG_LENGTH
  );

  const encrypted = data.subarray(
    IV_LENGTH + AUTH_TAG_LENGTH
  );

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

module.exports = {
  encryptToken,
  decryptToken,
};