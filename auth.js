// auth.js — password hashing/verification (PBKDF2 via WebCrypto, works on Cloudflare Workers)

// จำนวนรอบ: ยิ่งสูงยิ่งปลอดภัยแต่กิน CPU มากขึ้น
// 100000 เป็นค่ากลางที่ปลอดภัยและอยู่ในงบ CPU ของ Workers ได้สบาย
// ถ้าแพ็กเกจรองรับ CPU มากขึ้น ปรับขึ้นได้ (OWASP แนะนำสูงกว่านี้)
const PBKDF2_ITERATIONS = 100000;

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveBits(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256
  );
}

// สร้าง hash string รูปแบบ: pbkdf2$<iterations>$<salt_b64>$<hash_b64>
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToB64(salt)}$${bufToB64(bits)}`;
}

export function isHashed(stored) {
  return typeof stored === "string" && stored.startsWith("pbkdf2$");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// คืน { ok, legacy } — legacy = true แปลว่ารหัสใน DB ยังเป็น plaintext (ควร upgrade)
export async function verifyPassword(password, stored) {
  if (!isHashed(stored)) {
    return { ok: password === stored, legacy: true };
  }

  const parts = stored.split("$"); // [pbkdf2, iterations, salt, hash]
  if (parts.length !== 4) return { ok: false, legacy: false };

  const iterations = Number(parts[1]);
  const salt = b64ToBytes(parts[2]);
  const expected = parts[3];

  const bits = await deriveBits(password, salt, iterations);
  const actual = bufToB64(bits);

  return { ok: timingSafeEqual(actual, expected), legacy: false };
}