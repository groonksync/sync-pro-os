import CryptoJS from 'crypto-js';

const SETTINGS_KEY = 'SovereignLocalSettingsEncryptionKey2026_StaticKey';

/**
 * Cifra un valor de texto usando AES-256
 */
export const encryptValue = (val) => {
  if (!val) return '';
  return CryptoJS.AES.encrypt(val.trim(), SETTINGS_KEY).toString();
};

/**
 * Descifra un valor cifrado usando AES-256
 */
export const decryptValue = (cipher) => {
  if (!cipher) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SETTINGS_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
  } catch (e) {
    console.error('Error al descifrar el valor:', e);
    return '';
  }
};
