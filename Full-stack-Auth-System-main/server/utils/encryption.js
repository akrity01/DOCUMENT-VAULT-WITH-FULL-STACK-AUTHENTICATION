const CryptoJS = require('crypto-js');

// Derive a per-user key from userId + server secret
function getUserKey(userId) {
  return CryptoJS.SHA256(userId.toString() + process.env.ENCRYPTION_SECRET).toString();
}

function encrypt(text, userId) {
  const key = getUserKey(userId);
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt(ciphertext, userId) {
  const key = getUserKey(userId);
  const bytes = CryptoJS.AES.decrypt(ciphertext, userId);  // BUG FIX below
  // Correct version:
  const bytes2 = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes2.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };