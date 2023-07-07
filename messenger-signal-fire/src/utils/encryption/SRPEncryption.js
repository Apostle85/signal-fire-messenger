import { createSRPClient } from '@swan-io/srp';

export default class SRPEncryption {
  constructor({ type = 'SHA-256', bitsNumber = 2048 }) {
    this._SRPapi = createSRPClient(type, bitsNumber);
  }

  getEphemeral = () => this._ephemeral;
  
  getSession = () => this._session;
  
  getKey = () => this._session.key;

  getRegisterData = async (password) => {
    const salt = this._SRPapi.generateSalt();
    const privateKey = await this._SRPapi.deriveSafePrivateKey(salt, password);
    const verifier = this._SRPapi.deriveVerifier(privateKey);
    return { salt, verifier };
  };

  createSession = async (salt, serverKey, password) => {
    const privateKey = await this._SRPapi.deriveSafePrivateKey(salt, password);
    this._ephemeral = this._SRPapi.generateEphemeral();
    this._session = await this._SRPapi.deriveSession(
      this._ephemeral.secret,
      serverKey,
      salt,
      '',
      privateKey
    );
  };

  verifySession = async (serverProof) =>
    await this._SRPapi.verifySession(
      this._ephemeral.public,
      this._session,
      serverProof
    );
}
