const crypto = require('crypto');

const encode = (data) => {
  const encoder = new TextEncoder();
  return encoder.encode(JSON.stringify({ data }));
};

const decode = (byteStream) => {
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(byteStream)).data;
};

// Encrypt data
module.exports.encryptAesGcm256 = (data, key) => {
  try {
    const input = Buffer.from(key, 'hex'); // convert hex string to bytes
    const AESKey = new Uint8Array(crypto.createHash('sha256').update(input).digest());
    const iv = new Uint8Array(crypto.randomBytes(12));
    const encodedData = encode(data);
    const cipher = crypto.createCipheriv('aes-256-gcm', AESKey, iv);
    const ciphertext = new Uint8Array(Buffer.concat([
      cipher.update(encodedData, 'utf8'),
      cipher.final(),
    ]));
    const tag = new Uint8Array(cipher.getAuthTag());
    const ciphertextWithIVAndTag = new Uint8Array(
      ciphertext.byteLength + iv.byteLength + tag.byteLength,
    );
    ciphertextWithIVAndTag.set(iv, 0);
    ciphertextWithIVAndTag.set(ciphertext, iv.byteLength);
    ciphertextWithIVAndTag.set(tag, ciphertext.byteLength + iv.byteLength);
    return JSON.stringify({ cipher: Array.from(ciphertextWithIVAndTag) });
  } catch (err) {
    console.log(err);
  }
};

module.exports.decryptAesGcm256 = (data, key) => {
  try {
    const input = Buffer.from(key, 'hex'); // convert hex string to bytes
    const AESKey = new Uint8Array(crypto.createHash('sha256').update(input).digest());
    // Декодируем зашифрованные данные
    const encryptedDataWithIV = new Uint8Array(JSON.parse(data).cipher);
    const iv = encryptedDataWithIV.slice(0, 12);
    const encryptedData = encryptedDataWithIV.slice(12);
    // Создаем параметры алгоритма расшифровки
    const algorithm = 'aes-256-gcm';
    // Создаем объект расшифровки
    const decipher = crypto.createDecipheriv(algorithm, AESKey, iv);
    // Устанавливаем параметры алгоритма аутентификации
    decipher.setAuthTag(encryptedData.slice(-16));
    // Расшифровываем данные
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData.slice(0, -16)),
      decipher.final(),
    ]);
    console.log('decrypted: ', decryptedData);
    // Преобразуем расшифрованные данные в строку
    const str = decode(decryptedData);
    console.log('decoded: ', str);
    // Возвращаем расшифрованную строку
    return str;
  } catch (err) {
    console.log(err);
  }
};

// Decrypt data
// module.exports.getDecryptedData = ({ cipher, iv }, key) => {
//   try {

//     const bufCipher = Buffer.from(cipher, 'base64');
//     console.log('bufCipher: ', bufCipher);
//     const bufIV = Buffer.from(iv, 'base64');
//     console.log('bufIV: ', bufIV);
//     console.log('bufIVLength: ', bufIV.length);
//     const keyBuf = Buffer.from(key.slice(0, (key.length / 2)));
//     console.log('keyBuf: ', keyBuf);
//     console.log('keyLength: ', keyBuf.length);
//     const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, bufIV);
//     console.log('encodedData: ', decipher);
//     const encodedData = Buffer.concat([decipher.update(bufCipher), decipher.final()]);
//     console.log('encodedData: ', encodedData);
//     const data = decode(encodedData);
//     console.log('data: ', data);
//     return data;
//   } catch (err) {
//     console.log('!!! ERROR | DECRYPTION | ERROR !!! :', err);
//     throw new Error('DECRYPT ERROR');
//   }
// };

// module.exports.encrypt = (message, key) => {
//   const iv = crypto.randomBytes(16);

//   const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
//   let encrypted = cipher.update(message, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   const tag = cipher.getAuthTag();

//   let output = {
//     encrypted,
//     KEY: KEY.toString('hex'),
//     IV: IV.toString('hex'),
//     TAG: tag.toString('hex'),
//   };
//   return output;
// };
