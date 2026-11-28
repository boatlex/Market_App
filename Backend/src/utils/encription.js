import crypto from "crypto";
import { ENV } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(ENV.MESSAGE_ENCRYPTION_KEY, "hex"); //  32 bytes (64 hex chars)

export const encryptText = (plainText) => {
  if (!plainText) return plainText;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptText = (cipherText) => {
  if (!cipherText || !cipherText.includes(":")) return cipherText;

  try {
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) return cipherText;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    // Fallback for older unencrypted messages in the database
    return cipherText;
  }
};
