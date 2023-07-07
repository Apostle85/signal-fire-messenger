import { Convert, combine } from 'pvtsutils';
import AESGCMEncryption from './AESEncryption';

export default class DoubleRatchet {
  constructor() {
    this._DHRatchet = null;
    this._sendingRatchet = null;
    this._recievingRatchet = null;
    this.AD = null;
    this._id = null;
  }

  async init(_id, { initialRootKey, DHParams, isInitiator }) {
    this._id = _id;
    this._DHRatchet = new AsymmetricRatchet();
    this._sendingRatchet = new SendingRatchet();
    this._recievingRatchet = new RecievingRatchet();
    const state = this.loadState()
    if (!state) {
        console.log('OK: not loaded');
      await this._DHRatchet.init(initialRootKey, DHParams, isInitiator);
      this._sendingRatchet.restartRatchet(this._DHRatchet.outputKey);
      this._recievingRatchet.restartRatchet(this._DHRatchet.outputKey);
    } else await this.importState(state);
  }

  setAD(AD) {
    this.AD = AD;
  }

  async send(message) {
    console.log('DRX:SENDING:START:', message);
    console.log('DRX:PEER_KEY', this._DHRatchet.DHPeerKey);
    const exportedState = await this.exportState();
    // console.log('DRX:SENDING:STATE:', exportedState);
    const cipherPacket = await this._sendingRatchet.encrypt(
      message,
      { DHPeerKey: exportedState.DHRatchet.DHUserKeyPair.publicKey },
      this.AD
    );
    console.log('DRX:SENDING:END', cipherPacket);
    await this.saveState();
    return cipherPacket;
  }

  async recieve({ payload, header }) {
    console.log('DRX:RECEIVING:START', { payload, header });
    const headerDHKey = await window.crypto.subtle.importKey(
      'jwk',
      header.DHPeerKey,
      DRXUtils._settingsECDH,
      true,
      []
    );
    if(!!this._DHRatchet.DHPeerKey) {
    const peerKey = (await this.exportState()).DHRatchet.DHPeerKey;
    console.log('NewDHPeerKey:', header.DHPeerKey);
    console.log('PrevDHPeerKey:', peerKey);
    console.log('!prev:', !this._DHRatchet.DHPeerKey);
    console.log('new.x !== prev.x:', header.DHPeerKey.x !== peerKey.x);
    console.log('new.y !== prev.y:', header.DHPeerKey.y !== peerKey.y);
    }
    if (!this._DHRatchet.DHPeerKey || header.DHPeerKey.x !== (await this.exportState()).DHRatchet.DHPeerKey.x || header.DHPeerKey.y !== (await this.exportState()).DHRatchet.DHPeerKey.y) {
      console.log('check');
      this._DHRatchet.DHPeerKey = headerDHKey;
      await this._DHRatchet.turnRatchet();
      this._recievingRatchet.restartRatchet(this._DHRatchet.outputKey);

      this._DHRatchet.DHUserKeyPair = await DRXUtils.initDHKeyPair();
      await this._DHRatchet.turnRatchet();
      this._sendingRatchet.restartRatchet(this._DHRatchet.outputKey);
    }
    const message = await this._recievingRatchet.decrypt(payload, this.AD);
    console.log('DRX:RECEIVING:END', message);
    await this.saveState();
    return message;
  }

  async exportState() {
    return {
      DHRatchet: await this._DHRatchet.exportState(),
      sendingRatchet: await this._sendingRatchet.exportState(),
      recievingRatchet: await this._recievingRatchet.exportState(),
    };
  }

  async saveState() {
    const exportedState = await this.exportState();
    console.log('STATE:', exportedState);
    let earlierKeys = JSON.parse(localStorage.getItem('DoubleRatchet')) ?? [];
    earlierKeys = earlierKeys.filter((key) => key._id !== this._id);
    console.log(...(earlierKeys ?? []), { _id: this._id, key: exportedState });
    localStorage.setItem(
      'DoubleRatchet',
      JSON.stringify([
        ...(earlierKeys ?? []),
        { _id: this._id, key: exportedState },
      ])
    );
  }

  loadState() {
    const storage = JSON.parse(localStorage.getItem('DoubleRatchet'));
    console.log('DRX_STORAGE:', storage);
    if (!storage) return false;
    if(!storage.filter((el) => el._id === this._id)[0]) return false;
    return storage.filter((el) => el._id === this._id)[0].key;
  }

  async importState({ DHRatchet, sendingRatchet, recievingRatchet }) {
    console.log('DRX:LOCAL_STORAGE:LOAD_STATE:', {
      DHRatchet,
      sendingRatchet,
      recievingRatchet,
    });
    await this._DHRatchet.importState(DHRatchet);
    await this._sendingRatchet.importState(sendingRatchet);
    await this._recievingRatchet.importState(recievingRatchet);
  }
}

class SymmetricRatchet {
  constructor() {
    this.rootKey = null;
    this._AES = new AESGCMEncryption();
    this.keys = [];
  }

  async exportState() {
    return {
      rootKey: Array.from(
        new Uint8Array(
          await window.crypto.subtle.exportKey('raw', this.rootKey)
        )
      ),
      keys: this.keys,
    };
  }

  async importState({ rootKey, keys }) {
    this.rootKey = await DRXUtils.importHMAC(new Uint8Array(rootKey).buffer);
    this.keys = keys;
  }

  CIPHER_KEY_KDF_INPUT = new Uint8Array([1]).buffer;
  ROOT_KEY_KDF_INPUT = new Uint8Array([2]).buffer;

  restartRatchet(rootKey) {
    this.rootKey = rootKey;
  }

  async turnRatchet() {
    const { outputKey, rootKey } = await DRXUtils.symRatchetKDF(this.rootKey);
    this.rootKey = rootKey;
    const exportedKey = Array.from(new Uint8Array(outputKey));
    this.keys.push(exportedKey);
    console.log('SYM_RATCHET:TURNING_RATCHET:', {
      outputKey,
      rootKey,
      keys: this.keys,
    });
    return outputKey;
  }
}

class SendingRatchet extends SymmetricRatchet {
  async encrypt(message, header, AD) {
    const cipherKey = await super.turnRatchet();
    await this._AES.setKey(cipherKey);
    const cipherText = await this._AES.encryptAESGCM256({ message, AD });
    return { payload: cipherText, header };
  }
}

class RecievingRatchet extends SymmetricRatchet {
  async decrypt(payload, ownAD) {
    const cipherKey = await super.turnRatchet();
    console.log('KEY:', new Uint8Array(cipherKey));
    await this._AES.setKey(new Uint8Array(cipherKey));
    const { message, AD } = await this._AES.decryptAESGCM256(payload);
    if (ownAD !== AD)
      console.log('ERROR:AD_NOT_EQUAL:DIALOG_HAS_BEEN_COMPROMISED');
    return message;
  }
}

class AsymmetricRatchet {
  constructor() {
    this.rootKey = null;
    this.outputKey = null;
    this.DHUserKeyPair = null;
    this.DHPeerKey = null;
  }

  async exportState() {
    return {
      rootKey: Array.from(
        new Uint8Array(
          await window.crypto.subtle.exportKey('raw', this.rootKey)
        )
      ),
      outputKey: Array.from(
        new Uint8Array(
          await window.crypto.subtle.exportKey('raw', this.outputKey)
        )
      ),
      DHUserKeyPair: await DRXUtils.exportAsymKey(this.DHUserKeyPair),
      DHPeerKey: await window.crypto.subtle.exportKey('jwk', this.DHPeerKey),
    };
  }

  async importState({ rootKey, outputKey, DHUserKeyPair, DHPeerKey }) {
    console.log('rootKey:', rootKey);
    this.rootKey = await DRXUtils.importHMAC(new Uint8Array(rootKey).buffer);
    this.outputKey = await DRXUtils.importHMAC(
      new Uint8Array(outputKey).buffer
    );
    this.DHUserKeyPair = await DRXUtils.importAsymKey(
      DHUserKeyPair,
      DRXUtils._settingsECDH
    );
    this.DHPeerKey = await window.crypto.subtle.importKey(
      'jwk',
      DHPeerKey,
      DRXUtils._settingsECDH,
      true,
      []
    );
  }

  async init(initialRootKey, DHParams, isInitiator) {
    console.log('DRX:ASYM_RATCHET:INIT:START');
    isInitiator
      ? await this._initInitiator(initialRootKey, DHParams)
      : await this._initReceiver(initialRootKey, DHParams);
  }

  async _initInitiator(initialRootKey, DHPeerKey) {
    this.rootKey = initialRootKey;
    this.DHUserKeyPair = await DRXUtils.initDHKeyPair();
    console.log('DHUserKeyPair:', this.DHUserKeyPair);
    this.DHPeerKey = DHPeerKey;
    console.log('DRX:ASYM_RATCHET:INIT:ROOT_KEY: ', this.rootKey);
    await this.turnRatchet(this.DHUserKeyPair, DHPeerKey);
  }

  _initReceiver(initialRootKey, DHUserKeyPair) {
    this.rootKey = initialRootKey;
    this.DHUserKeyPair = DHUserKeyPair;
    console.log('DRX:ASYM_RATCHET:INIT:ROOT_KEY: ', this.rootKey);
    console.log('DHUserKeyPair:', this.DHUserKeyPair);
  }

  async turnRatchet() {
    const { outputKey, rootKey } = await DRXUtils.asymRatchetKDF(
      { DHUserKey: this.DHUserKeyPair.privateKey, DHPeerKey: this.DHPeerKey },
      this.rootKey
    );
    this.outputKey = outputKey;
    this.rootKey = rootKey;
    console.log('DRX:ASYM_RATCHET:TURNING:NEW_KEYS: ', {
      rootKey: this.rootKey,
      outputKey: this.outputKey,
    });
  }
}

class DRXUtils {
  static _settingsECDH = {
    name: 'ECDH',
    namedCurve: 'P-256',
  };
  static INFO_MESSAGE_KEYS = Convert.FromBinary('signal-fire');

  static async asymRatchetKDF({ DHUserKey, DHPeerKey }, prevRootKey) {
    const exportedUserKey = await window.crypto.subtle.exportKey('jwk', DHUserKey);
    const exportedPeerKey = await window.crypto.subtle.exportKey('jwk', DHPeerKey);
    const derivedBits = await this.deriveBits(DHPeerKey, DHUserKey);
    console.log('derivedBits DH: ', derivedBits);
    const { rootKey, outputKey } = await this.HKDF(
      derivedBits,
      prevRootKey,
      this.INFO_MESSAGE_KEYS
    );
    return {
      outputKey,
      rootKey,
    };
  }

  static async importAsymKey(
    { publicKey, privateKey },
    algorithm,
    usagePublic = [],
    usagePrivate = ['deriveBits']
  ) {
    return {
      publicKey: await window.crypto.subtle.importKey(
        'jwk',
        publicKey,
        algorithm,
        true,
        usagePublic
      ),
      privateKey: await window.crypto.subtle.importKey(
        'jwk',
        privateKey,
        algorithm,
        true,
        usagePrivate
      ),
    };
  }

  static async exportAsymKey({ publicKey, privateKey }) {
    return {
      publicKey: await window.crypto.subtle.exportKey('jwk', publicKey),
      privateKey: await window.crypto.subtle.exportKey('jwk', privateKey),
    };
  }

  static async importHMAC(raw) {
    return await window.crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      true,
      ['sign', 'verify']
    );
  }

  static async initDHKeyPair() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveBits']
    );
  }

  static async sign(key, data) {
    return await window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      key,
      data
    );
  }

  static async deriveBits(publicKey, privateKey) {
    return window.crypto.subtle.deriveBits(
      { name: 'ECDH', public: publicKey },
      privateKey,
      256
    );
  }

  static CIPHER_KEY_KDF_INPUT = new Uint8Array([1]).buffer;
  static ROOT_KEY_KDF_INPUT = new Uint8Array([2]).buffer;

  static async symRatchetKDF(rootKey) {
    const cipherKeyBytes = await this.sign(rootKey, this.CIPHER_KEY_KDF_INPUT);
    const nextRootKeyBytes = await this.sign(rootKey, this.ROOT_KEY_KDF_INPUT);
    return {
      outputKey: cipherKeyBytes,
      rootKey: await this.importHMAC(nextRootKeyBytes),
    };
  }

  static async HKDF(IKM, salt = undefined, info = new ArrayBuffer(0)) {
    if (!salt) {
      salt = await this.importHMAC(new Uint8Array(32).buffer);
    }
    const PRKBytes = await this.sign(salt, IKM);
    const PRK = await this.importHMAC(PRKBytes);
    const T = [new ArrayBuffer(0)];
    for (let i = 0; i < 2; i++) {
      T[i + 1] = await this.sign(
        PRK,
        combine(T[i], info, new Uint8Array([i + 1]).buffer)
      );
    }
    const keys = T.slice(1);
    return {
      rootKey: await this.importHMAC(keys[0]),
      outputKey: await this.importHMAC(keys[1]),
    };
  }
}
