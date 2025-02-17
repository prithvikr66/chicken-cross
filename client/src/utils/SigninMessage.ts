export class SigninMessage {
  domain: string;
  publicKey: string;
  nonce: string;
  statement: string;

  constructor(domain: string, publicKey: string, nonce: string) {
    this.domain = domain;
    this.publicKey = publicKey;
    this.nonce = nonce;
    this.statement = `Sign this message for authenticating with your wallet. Nonce: ${nonce}`;
  }

  prepare() {
    return `${this.statement}\n\nDomain: ${this.domain}\nPublic Key: ${this.publicKey}\nNonce: ${this.nonce}`;
  }
}