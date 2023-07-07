import { MAIN_API_URL, MOVIES_API_URL } from '../constants.js';
import AESGCMEncryption from '../encryption/AESEncryption.js';
import DoubleRatchet from '../encryption/doubleRatchet.js';
import SRPEncryption from '../encryption/SRPEncryption.js';
import X3DH from '../encryption/X3DH.js';

class MainApi {
  constructor({ url, headers }) {
    this._url = url;
    this._headers = headers;
    this._SRP = new SRPEncryption({});
    this._AES = new AESGCMEncryption();
    this._X3DH = new X3DH({});
    this._doubleRatchet = new DoubleRatchet();
  }

  _getResponse(res) {
    if (res.ok) return res.json();
    return res.text().then((text) => {
      throw new Error(text);
    });
  }

  async register({ name, email, password }) {
    // SRP part
    const { salt, verifier } = await this._SRP.getRegisterData(password);
    // Initializing X3DH Key Bundle
    await this._X3DH.init();
    const bundle = await this._X3DH.exportRecieverBundle();
    // Fetch
    return fetch(`${this._url}/signup`, {
      method: 'POST',
      headers: this._headers,
      body: JSON.stringify({
        name,
        email,
        salt,
        verifier,
        bundle,
        image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      }),
    }).then((res) => {
      return this._getResponse(res);
    });
  }

  async login({ email, password }) {
    try {
      // Getting Server Response Data from Login Request
      const rawData = await fetch(`${this._url}/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: this._headers,
        body: JSON.stringify({
          email,
        }),
      });
      const {
        data: { salt, serverKey },
      } = await this._getResponse(rawData);
      // Creating SRP Client Session
      await this._SRP.createSession(salt, serverKey, password);
      // Getting Server Response Data from Login Proof Request
      const clientEphemeral = this._SRP.getEphemeral().public;
      const clientProof = this._SRP.getSession().proof;
      const rawProofData = await fetch(`${this._url}/signin/proof`, {
        method: 'POST',
        credentials: 'include',
        headers: this._headers,
        body: JSON.stringify({
          email,
          clientEphemeral,
          clientProof,
        }),
      });
      const {
        data: { _id, serverProof },
      } = await this._getResponse(rawProofData);
      // Verifying Server Proof & Setting AES Key
      await this._SRP.verifySession(serverProof);
      // !!! AES Key is in DIFFERENT FORMAT from SRP key !!!
      const hash = new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          this._AES._hexStringToUint8Array(this._SRP.getKey())
        )
      );
      await this._AES.setKey(hash);
      console.log('SRP:SHARED_KEY', this._SRP.getKey());
      localStorage.setItem('AES_KEY', hash);
      return { data: _id };
    } catch (err) {
      console.log(err);
    }
  }

  checkAESKey = () => !!this._AES.getKey();

  logout() {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/signout`, {
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    });
  }

  // Отправка отредактированной информации о пользователе
  async updateProfile({ name, email }) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    const sendingData = { name, email };
    console.log('DATA:', sendingData);
    const packedData = JSON.stringify({
      data: await this._AES.encryptAESGCM256(sendingData),
    });
    console.log('Encrypted:', JSON.parse(packedData).data);
    console.log('Packed:', packedData);
    return fetch(`${this._url}/users/me`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this._headers,
      body: packedData,
    })
      .then((res) => {
        return this._getResponse(res);
      })
      .then(({ data }) => {
        console.log('Packed: ', {data});
        console.log('Encrypted: ', data);
        return this._AES.decryptAESGCM256(data)
      })
      .then((res) => {
        console.log('DATA: ', res);
        return { data: res };
      });
  }

  // Получение информации о своем профиле
  getProfile() {
    if (!this.checkAESKey()) return Promise.reject('Error: no Shared Key yet');
    return fetch(`${this._url}/users/me`, {
      credentials: 'include',
      headers: this._headers,
    })
      .then((res) => {
        return this._getResponse(res);
      })
      .then(({ data }) => this._AES.decryptAESGCM256(data))
      .then((res) => {
        return { data: res };
      });
  }

  // Получение информации о другом пользователе по id
  async getUser(userId) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/users/user/${userId}`, {
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      return { data: res };
    });
  }

  async getUsers(regexp) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/users/${regexp}`, {
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      console.log(res);
      return { data: res };
    });
  }

  async initEncryptionViaStorage() {
    // AES Shared Key for CLIENT-SERVER Encryption
    if (!localStorage.getItem('AES_KEY'))
      return Promise.reject('Error: no Shared Key yet');
    const AESKey = new Uint8Array(
      localStorage
        .getItem('AES_KEY')
        .split(',')
        .map((num) => parseInt(num))
    );
    await this._AES.setKey(AESKey);
    console.log('localstorage:', this._AES.getKey());
  }

  getFriends() {
    if (!this.checkAESKey()) return Promise.reject('Error: no Shared Key yet');
    return fetch(`${this._url}/users/friends`, {
      credentials: 'include',
      headers: this._headers,
    })
      .then((res) => {
        return this._getResponse(res);
      })
      .then(({ data }) => {
        return this._AES.decryptAESGCM256(data);
      })
      .then((res) => {
        return { data: res };
      });
  }

  async followUser(userId) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/users/user/${userId}/follow`, {
      method: 'PUT',
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then(async (res) => {
      console.log('CHECK')
      console.log(res);
      await this._X3DH.setRecieverPeerBundle(res.bundle);
      console.log(this._X3DH.peerBundle);
      await this._X3DH._saveRecieverPeerKeys(userId);
      return { data: res };
    });
  }

  async unfollowUser(userId) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/users/user/${userId}/follow`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      return { data: res };
    });
  }

  getDialogs() {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/dialogs`, {
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      return { data: res };
    });
  }

  async createDialog({ receiverId }) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    const sendingData = { receiverId };
    const packedData = JSON.stringify({
      data: await this._AES.encryptAESGCM256(sendingData),
    });
    return fetch(`${this._url}/dialogs`, {
      method: 'POST',
      credentials: 'include',
      headers: this._headers,
      body: packedData,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      return { data: res };
    });
  }

  async removeDialog({ senderId, receiverId }) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    const sendingData = { senderId, receiverId };
    const packedData = JSON.stringify({
      data: await this._AES.encryptAESGCM256(sendingData),
    });
    return fetch(`${this._url}/dialogs`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this._headers,
      body: packedData,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      return { data: res };
    });
  }

  async getDialogMessages(dialogId) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    return fetch(`${this._url}/messages/${dialogId}`, {
      credentials: 'include',
      headers: this._headers,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      console.log(res);
      return { data: res };
    });
  }

  // 'Content-Type': 'multipart/form-data',
  async createMessage({ dialogId, senderId, text }) {
    if (!this.checkAESKey()) return console.log('Error: no Shared Key yet');
    console.log(text);
    const sendingData = { dialogId, senderId, text };
    console.log(sendingData);
    const packedData = JSON.stringify({
      data: await this._AES.encryptAESGCM256(sendingData),
    });
    return fetch(`${this._url}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: this._headers,
      body: packedData,
    }).then((res) => {
      return this._getResponse(res);
    })
    .then(({ data }) => this._AES.decryptAESGCM256(data))
    .then((res) => {
      return { data: res };
    });
  }
}

export default new MainApi({
  url: MAIN_API_URL,
  headers: { 'Content-Type': 'application/json' },
});
