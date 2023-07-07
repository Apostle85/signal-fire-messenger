import { Convert, combine } from 'pvtsutils';
export default class X3DH {
  constructor({ curve = 'P-256' }) {
    this._curve = curve;
    console.log(this._curve);
    this.peerBundle = {
      IPK: {
        signing: null,
        deriving: null,
      },
      SPK: null,
      SPKSignature: null,
      IPKSignature: null,
      EK: null,
    };
    this.userBundle = {
      IPK: {
        signing: null,
        deriving: null,
      },
      SPK: null,
      SPKSignature: null,
      IPKSignature: null,
      EK: null,
    };
    this._sharedKey = null;
  }

  static _settingsECDSA = {
    name: 'ECDSA',
    namedCurve: 'P-256',
  };
  static _settingsECDH = {
    name: 'ECDH',
    namedCurve: 'P-256',
  };
  static _settingsSign = {
    name: 'ECDSA',
    hash: { name: 'SHA-256' },
  };

  async _exportAsymKey({ publicKey, privateKey }) {
    return {
      publicKey: await window.crypto.subtle.exportKey('jwk', publicKey),
      privateKey: await window.crypto.subtle.exportKey('jwk', privateKey),
    };
  }

  async _importAsymKey(
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
  // Inits X3DH Protocol
  async init() {
    const userKeys = await this._initUserKeys();
    this.setUserKeys(userKeys);
    await this._saveUserKeys();
  }

  async startDialog(_id) {
    console.log('START_DIALOG: START');
    if (!this.userBundle.IPK.deriving) {
      const savedUserKeys = await this.getSavedUserKeys();
      this.setUserKeys(savedUserKeys);
    }
    if (!this.peerBundle.IPK.deriving) {
      if (!this.getSavedPeerKeys(_id)) throw new Error('сорян ты кому звонишь');
      console.log(this.getSavedPeerKeys(_id));
      await this.setRecieverPeerBundle(this.getSavedPeerKeys(_id));
    }
    if (!(await this._verifySignatures()))
      throw new Error('сорян ты неверифицированный бебрик');
    await this._computeInitiatorSharedKey(_id);
    console.log('KEY_EXCHANGE_RESULT: ', this._sharedKey);
    console.log('START_DIALOG: END');
    return await this.exportInitiatorBundle();
  }

  async continueDialog(_id, { IPK, EK }) {
    console.log('START_DIALOG: START');
    if (!this.userBundle.IPK.deriving) {
      const savedUserKeys = await this.getSavedUserKeys();
      console.log(savedUserKeys);
      this.setUserKeys(savedUserKeys);
    }
    await this.setInitiatorPeerBundle({
      IPKDerivingPublicKey: IPK.deriving,
      EKPublicKey: EK,
    });
    await this.computeRecieverSharedKey(_id);
    console.log('KEY_EXCHANGE_RESULT: ', this._sharedKey);
    console.log('START_DIALOG: END');
  }
  // async continueDialog(_id) {
  //   console.log('CONTINUE_DIALOG: START');
  //   this._sharedKey = await this.getSavedSharedKey(_id);
  //   if (!this.userBundle.IPK.deriving) {
  //     console.log(this.userBundle.IPK.deriving);
  //     const savedUserKeys = await this.getSavedUserKeys();
  //     console.log(savedUserKeys);
  //     this.setUserKeys(savedUserKeys);
  //   }
  //   if (!this.peerBundle.IPK.deriving) {
  //     const peerKeys = this.getSavedPeerKeys(_id);
  //     if (!peerKeys) throw new Error('сорян ты кому звонишь');
  //     console.log(peerKeys);
  //     this.setRecieverPeerBundle(this.getSavedPeerKeys(_id));
  //   }
  //   console.log('CONTINUE_DIALOG: END');
  // }
  // Inits Users Keys
  async _initUserKeys() {
    console.log('X3DH_PROTOCOL: INIT_USERS_KEYS(): START');
    console.log('ECDSA');
    const IPKSigning = await window.crypto.subtle.generateKey(
      X3DH._settingsECDSA,
      true,
      ['sign', 'verify']
    );
    console.log('ECDH');
    const IPKDeriving = await window.crypto.subtle.generateKey(
      X3DH._settingsECDH,
      true,
      ['deriveBits']
    );
    console.log('ECDH');
    const SPK = await window.crypto.subtle.generateKey(
      X3DH._settingsECDH,
      true,
      ['deriveBits']
    );
    console.log(SPK);
    const SPKSignature = Array.from(
      new Uint8Array(
        await window.crypto.subtle.sign(
          X3DH._settingsSign,
          IPKSigning.privateKey,
          await window.crypto.subtle.exportKey('raw', SPK.publicKey)
        )
      )
    );
    const IPKSignature = Array.from(
      new Uint8Array(
        await window.crypto.subtle.sign(
          X3DH._settingsSign,
          IPKSigning.privateKey,
          await window.crypto.subtle.exportKey('raw', IPKDeriving.publicKey)
        )
      )
    );
    console.log('X3DH_PROTOCOL: INIT_USERS_KEYS(): END');
    return {
      IPK: {
        signing: IPKSigning,
        deriving: IPKDeriving,
      },
      SPK: SPK,
      SPKSignature,
      IPKSignature,
    };
  }

  async _exportUserKeys() {
    const exportedIPKSigning = await this._exportAsymKey(
      this.userBundle.IPK.signing
    );
    const exportedIPKDeriving = await this._exportAsymKey(
      this.userBundle.IPK.deriving
    );
    const exportedSPK = await this._exportAsymKey(this.userBundle.SPK);
    const exportedEK = this.userBundle.EK
      ? await this._exportAsymKey(this.userBundle.EK)
      : undefined;
    return {
      IPK: {
        signing: exportedIPKSigning,
        deriving: exportedIPKDeriving,
      },
      SPK: exportedSPK,
      SPKSignature: this.userBundle.SPKSignature,
      IPKSignature: this.userBundle.IPKSignature,
      EK: exportedEK,
    };
  }

  async exportRecieverBundle() {
    const { IPK, SPK, SPKSignature, IPKSignature } =
      await this._exportUserKeys();
    return {
      IPK: { signing: IPK.signing.publicKey, deriving: IPK.deriving.publicKey },
      SPK: SPK.publicKey,
      SPKSignature,
      IPKSignature,
    };
  }

  async exportInitiatorBundle() {
    const { IPK, EK } = await this._exportUserKeys();
    return {
      IPK: { signing: null, deriving: IPK.deriving.publicKey },
      EK: EK.publicKey,
    };
  }

  async exportReceiverPeerKeys() {
    console.log(this.peerBundle);
    const exportedIPKSigning = await window.crypto.subtle.exportKey(
      'jwk',
      this.peerBundle.IPK.signing
    );
    const exportedIPKDeriving = await window.crypto.subtle.exportKey(
      'jwk',
      this.peerBundle.IPK.deriving
    );
    const exportedSPK = await window.crypto.subtle.exportKey(
      'jwk',
      this.peerBundle.SPK
    );
    return {
      IPK: {
        signing: exportedIPKSigning,
        deriving: exportedIPKDeriving,
      },
      SPK: exportedSPK,
      SPKSignature: this.peerBundle.SPKSignature,
      IPKSignature: this.peerBundle.IPKSignature,
    };
  }

  async exportInitiatorPeerKeys() {
    const exportedIPKDeriving = await window.crypto.subtle.exportKey(
      'jwk',
      this.peerBundle.IPK.deriving
    );
    const exportedEK = await window.crypto.subtle.exportKey(
      'jwk',
      this.peerBundle.EK
    );
    return {
      IPK: {
        signing: null,
        deriving: exportedIPKDeriving,
      },
      EK: exportedEK,
    };
  }

  async _importUserKeys({
    IPK: { signing: IPKSigning, deriving: IPKDeriving },
    SPK,
    SPKSignature,
    IPKSignature,
  }) {
    return {
      IPK: {
        signing: await this._importAsymKey(
          IPKSigning,
          X3DH._settingsECDSA,
          ['verify'],
          ['sign']
        ),
        deriving: await this._importAsymKey(IPKDeriving, X3DH._settingsECDH),
      },
      SPK: await this._importAsymKey(SPK, X3DH._settingsECDH),
      SPKSignature: new Uint8Array(SPKSignature).buffer,
      IPKSignature: new Uint8Array(IPKSignature).buffer,
    };
  }

  // Setting Keys
  setUserKeys({
    IPK = this.userBundle.IPK,
    SPK = this.userBundle.SPK,
    SPKSignature = this.userBundle.SPKSignature,
    IPKSignature = this.userBundle.IPKSignature,
    EK = this.userBundle.EK,
  }) {
    this.userBundle = {
      IPK: {
        signing: IPK.signing,
        deriving: IPK.deriving,
      },
      SPK,
      SPKSignature,
      IPKSignature,
      EK,
    };
  }

  setPeerKeys({
    IPK: {
      signing: IPKSigning = this.peerBundle.IPK.signing,
      deriving: IPKDeriving = this.peerBundle.IPK.deriving,
    },
    SPK = this.peerBundle.SPK,
    SPKSignature = this.peerBundle.SPKSignature,
    IPKSignature = this.peerBundle.IPKSignature,
    EK = this.peerBundle.EK,
  }) {
    this.peerBundle = {
      IPK: {
        signing: IPKSigning,
        deriving: IPKDeriving,
      },
      SPK,
      SPKSignature,
      IPKSignature,
      EK,
    };
  }

  // Storing User Keys in Local Storage
  async _saveUserKeys() {
    const exportedUserKeys = await this._exportUserKeys();
    // const earlierKeys =
    //   JSON.parse(localStorage.getItem('X3DH_USER_KEYS_STORAGE')) ?? [];
    // console.log(earlierKeys);
    // if (earlierKeys.some((key) => key._id === myId)) return;
    // console.log(...(earlierKeys ?? []), { _id: myId, key: exportedUserKeys });
    // localStorage.setItem(
    //   'X3DH_USER_KEYS_STORAGE',
    //   JSON.stringify([...(earlierKeys ?? []), { _id: myId, key: exportedUserKeys }])
    // );
    localStorage.setItem(
      'X3DH_USER_KEYS_STORAGE',
      JSON.stringify(exportedUserKeys)
    );
  }

  async _saveInitiatorPeerKeys(_id) {
    const exportedPeerKeys = await this.exportInitiatorPeerKeys();
    const earlierKeys =
      JSON.parse(localStorage.getItem('X3DH_PEER_KEYS_STORAGE')) ?? [];
    console.log(earlierKeys);
    if (earlierKeys.some((key) => key._id === _id)) return;
    console.log(...(earlierKeys ?? []), { _id, key: exportedPeerKeys });
    localStorage.setItem(
      'X3DH_PEER_KEYS_STORAGE',
      JSON.stringify([...(earlierKeys ?? []), { _id, key: exportedPeerKeys }])
    );
  }

  async _saveRecieverPeerKeys(_id) {
    const exportedPeerKeys = await this.exportReceiverPeerKeys();
    const earlierKeys =
      JSON.parse(localStorage.getItem('X3DH_PEER_KEYS_STORAGE')) ?? [];
    console.log(earlierKeys);
    if (earlierKeys.some((key) => key._id === _id)) return;
    console.log(...(earlierKeys ?? []), { _id, key: exportedPeerKeys });
    localStorage.setItem(
      'X3DH_PEER_KEYS_STORAGE',
      JSON.stringify([...(earlierKeys ?? []), { _id, key: exportedPeerKeys }])
    );
  }

  getSavedPeerKeys(_id) {
    const storage = JSON.parse(localStorage.getItem('X3DH_PEER_KEYS_STORAGE'));
    if (!storage) return false;
    return storage.filter((el) => el._id === _id)[0].key;
  }

  // Getting User Keys from Local Storage
  async getSavedUserKeys() {
    const storage = JSON.parse(localStorage.getItem('X3DH_USER_KEYS_STORAGE'));
    if (!storage) return false;
    // const el = storage.filter((el) => el._id === _id)[0].key;
    return await this._importUserKeys(storage);
  }

  async setInitiatorPeerBundle({ IPKDerivingPublicKey, EKPublicKey }) {
    console.log('X3DH_PROTOCOL: SET_KEYS(): START');
    if (!IPKDerivingPublicKey || !EKPublicKey) {
      console.log('X3DH_PROTOCOL: SET_KEYS(): ERROR: KEYS_UNDEFINED');
      return;
    }
    const IPKDeriving = await window.crypto.subtle.importKey(
      'jwk',
      IPKDerivingPublicKey,
      X3DH._settingsECDH,
      true,
      []
    );
    const EK = await window.crypto.subtle.importKey(
      'jwk',
      EKPublicKey,
      X3DH._settingsECDH,
      true,
      []
    );
    this.setPeerKeys({
      IPK: { signing: null, deriving: IPKDeriving },
      EK,
    });
    console.log('X3DH_PROTOCOL: SET_KEYS(): END');
  }

  async setRecieverPeerBundle({
    IPK: { signing: IPKSigningPublicKey, deriving: IPKDerivingPublicKey },
    SPK,
    SPKSignature,
    IPKSignature,
  }) {
    if (
      !IPKSigningPublicKey ||
      !IPKDerivingPublicKey ||
      !SPK ||
      !SPKSignature ||
      !IPKSignature
    ) {
      console.log('X3DH_PROTOCOL: SET_KEYS(): ERROR: KEYS_UNDEFINED');
      return;
    }
    const IPKsigning = await window.crypto.subtle.importKey(
      'jwk',
      IPKSigningPublicKey,
      X3DH._settingsECDSA,
      true,
      ['verify']
    );
    const IPKderiving = await window.crypto.subtle.importKey(
      'jwk',
      IPKDerivingPublicKey,
      X3DH._settingsECDH,
      true,
      []
    );
    SPK = await window.crypto.subtle.importKey(
      'jwk',
      SPK,
      X3DH._settingsECDH,
      true,
      []
    );
    this.setPeerKeys({
      IPK: { signing: IPKsigning, deriving: IPKderiving },
      SPK,
      SPKSignature,
      IPKSignature,
    });
  }

  async _verifySignatures() {
    console.log(this.peerBundle)
    return (
      (await window.crypto.subtle.verify(
        X3DH._settingsSign,
        this.peerBundle.IPK.signing,
        new Uint8Array(this.peerBundle.SPKSignature).buffer,
        await window.crypto.subtle.exportKey('raw', this.peerBundle.SPK)
      )) &&
      (await window.crypto.subtle.verify(
        X3DH._settingsSign,
        this.peerBundle.IPK.signing,
        new Uint8Array(this.peerBundle.IPKSignature).buffer,
        await window.crypto.subtle.exportKey(
          'raw',
          this.peerBundle.IPK.deriving
        )
      ))
    );
  }

  async _computeInitiatorSharedKey(_id) {
    // Computing Shared Key
    const EK = await window.crypto.subtle.generateKey(
      X3DH._settingsECDH,
      true,
      ['deriveBits']
    );
    this.setUserKeys({ EK });
    const DH1 = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: this.peerBundle.SPK,
      },
      this.userBundle.IPK.deriving.privateKey,
      256
    );
    const DH2 = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: this.peerBundle.IPK.deriving,
      },
      this.userBundle.EK.privateKey,
      256
    );
    const DH3 = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: this.peerBundle.SPK,
      },
      this.userBundle.EK.privateKey,
      256
    );
    const _F = new Uint8Array(32);
    for (let i = 0; i < _F.length; i++) {
      _F[i] = 0xff;
    }
    const F = _F.buffer;
    const KM = combine(F, DH1, DH2, DH3); // TODO: F || KM, where F = 0xFF * N
    const keys = await this.HKDF(KM, 1, Convert.FromBinary('signal-fire'));
    this._sharedKey = await this._importHMAC(keys[0]);
    const exportedSharedKey = JSON.stringify(
      Array.from(
        new Uint8Array(
          await window.crypto.subtle.exportKey('raw', this._sharedKey)
        )
      )
    );
    let sharedKeys =
      JSON.parse(localStorage.getItem('X3DH_SHARED_KEYS_STORAGE')) ?? [];
    sharedKeys = sharedKeys.filter((el) => el._id !== _id);
    localStorage.setItem(
      'X3DH_SHARED_KEYS_STORAGE',
      JSON.stringify([...sharedKeys, { _id, key: exportedSharedKey }])
    );
  }

  async computeRecieverSharedKey(_id) {
    // Computing Shared Key
    const DH1 = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: this.peerBundle.IPK.deriving,
      },
      this.userBundle.SPK.privateKey,
      256
    );
    const DH2 = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: this.peerBundle.EK,
      },
      this.userBundle.IPK.deriving.privateKey,
      256
    );
    const DH3 = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: this.peerBundle.EK,
      },
      this.userBundle.SPK.privateKey,
      256
    );
    const _F = new Uint8Array(32);
    for (let i = 0; i < _F.length; i++) {
      _F[i] = 0xff;
    }
    const F = _F.buffer;
    const KM = combine(F, DH1, DH2, DH3); // TODO: F || KM, where F = 0xFF * N
    const keys = await this.HKDF(KM, 1, Convert.FromBinary('signal-fire'));
    console.log('SHARED_KEY: ', keys[0]);
    this._sharedKey = await this._importHMAC(keys[0]);
    const exportedSharedKey = JSON.stringify(
      Array.from(
        new Uint8Array(
          await window.crypto.subtle.exportKey('raw', this._sharedKey)
        )
      )
    );
    console.log(exportedSharedKey);
    let sharedKeys =
      JSON.parse(localStorage.getItem('X3DH_SHARED_KEYS_STORAGE')) ?? [];
    sharedKeys = sharedKeys.filter((el) => el._id !== _id);
    localStorage.setItem(
      'X3DH_SHARED_KEYS_STORAGE',
      JSON.stringify([...sharedKeys, { _id, key: exportedSharedKey }])
    );
    console.log(JSON.parse(localStorage.getItem('X3DH_SHARED_KEYS_STORAGE')));
  }

  async getSavedSharedKey(id) {
    const storage = localStorage.getItem('X3DH_SHARED_KEYS_STORAGE');
    if (!storage) return Promise.resolve(false);
    const keyObject = JSON.parse(storage).filter(
      ({ _id, key }) => _id === id
    )[0];
    if (!keyObject) return Promise.resolve(false);
    const key = new Uint8Array(JSON.parse(keyObject.key)).buffer;
    console.log('SAVED_SHARED_KEY:', key);
    return keyObject ? await this._importHMAC(key) : Promise.resolve(false);
  }

  async _importHMAC(raw) {
    // console.log("HMAC:", Convert.ToHex(raw));
    return await window.crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      true,
      ['sign', 'verify']
    );
  }

  async sign(key, data) {
    return await window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      key,
      data
    );
  }

  async HKDF(IKM, keysCount = 1, info = new ArrayBuffer(0)) {
    const salt = await this._importHMAC(new Uint8Array(32).buffer);
    const PRKBytes = await this.sign(salt, IKM);
    const PRK = await this._importHMAC(PRKBytes);
    const T = [new ArrayBuffer(0)];
    for (let i = 0; i < keysCount; i++) {
      T[i + 1] = await this.sign(
        PRK,
        combine(T[i], info, new Uint8Array([i + 1]).buffer)
      );
    }
    return T.slice(1);
  }
}
