export default class AESGCMEncryption {
  constructor() {
    this._key = null;
  }

  _generateIv = () => window.crypto.getRandomValues(new Uint8Array(12));

  _encode = (data) => {
    const encoder = new TextEncoder();
    return encoder.encode(JSON.stringify({ data }));
  };

  _decode = (byteStream) => {
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(byteStream)).data;
  };

  _pack = (cipher) => JSON.stringify({ cipher });

  _unpack = (cipher) => new Uint8Array(JSON.parse(cipher).cipher);

  _encrypt = async (data, key) => {
    try {
      // Сгенерировать случайный вектор инициализации
      const iv = this._generateIv();
      // Установить параметры алгоритма шифрования
      const algorithm = {
        name: 'AES-GCM',
        length: 256,
        iv: iv,
      };
      // Создать объект шифрования
      const cipher = await window.crypto.subtle.encrypt(algorithm, key, data);
      const ciphertext = new Uint8Array(cipher.slice(0, -16));
      // Получить аутентификационный тег
      const tag = new Uint8Array(cipher.slice(-16));
      // Объединить зашифрованные данные и аутентификационный тег в один буфер
      const encryptedDataWithIVAndTag = new Uint8Array(
        ciphertext.byteLength + iv.byteLength + tag.byteLength
      );
      encryptedDataWithIVAndTag.set(iv, 0);
      encryptedDataWithIVAndTag.set(ciphertext, iv.byteLength);
      encryptedDataWithIVAndTag.set(tag, ciphertext.byteLength + iv.byteLength);
      // Вернуть зашифрованные данные и аутентификационный тег в формате base64
      return Array.from(encryptedDataWithIVAndTag);
    } catch (err) {
      console.log(err);
    }
  };

  _decrypt = async (encrypted, key) => {
    const iv = encrypted.slice(0, 12);
    const encryptedWithTag = encrypted.slice(12);
    return await window.crypto.subtle
      .decrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        key,
        encryptedWithTag
      )
      .catch((err) => console.log(err));
  };

  _hexStringToUint8Array = (hexString) =>
    new Uint8Array(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );

  setKey = async (key) => {
    this._key = await window.crypto.subtle.importKey('raw', key, 'AES-GCM', true, [
      'encrypt',
      'decrypt',
    ]);
  };

  getKey = () => this._key;

  encryptAESGCM256 = async (data) => {
    try {
      const encodedData = this._encode(data);
      const cipher = await this._encrypt(encodedData, this._key);
      const packedData = this._pack(cipher);
      return packedData;
    } catch (err) {
      console.log(err);
    }
  };

  decryptAESGCM256 = async (cipher) => {
    try {
      const unpackedData = this._unpack(cipher);
      const encodedData = await this._decrypt(unpackedData, this._key);
      const data = this._decode(encodedData);
      return data;
    } catch (err) {
      console.log(err);
    }
  };
};
