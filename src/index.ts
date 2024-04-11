function ab2b64(arrayBuffer: any) {
  return window.btoa(
    String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
  );
}

const decryptMessage = async (encrypted: any, privateKeyReloaded: any) => {
  const dec = new TextDecoder();
  const decryptedText = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKeyReloaded,
    encrypted
  );
  console.log(`Decrypted message: ${dec.decode(decryptedText)}`);
};

const main = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: "SHA-256" },
    },
    true,
    ["verify", "sign"]
  );

  const publicKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey
  );
  const privateKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey
  );

  const message = "Hello world!";

  // Prepare encoding
  const enc = new TextEncoder();
  const encodedText = enc.encode(message);

  // Get public key as a string
  const exportedPublicKey = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const publicKeyToString = Buffer.from(exportedPublicKey).toString("base64");

  // Get private key as a string
  const exportedPrivateKey = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );
  const privateKeyToString = Buffer.from(exportedPrivateKey).toString("base64");

  // Adapt configuration
  publicKey.key_ops = ["encrypt"];
  privateKey.key_ops = ["decrypt"];
  publicKey.alg = "RSA-OAEP-256";
  privateKey.alg = "RSA-OAEP-256";
  const publicKeyReloaded = await window.crypto.subtle.importKey(
    "jwk",
    publicKey,
    { name: "RSA-OAEP", hash: { name: "SHA-256" } },
    true,
    ["encrypt"]
  );
  const privateKeyReloaded = await window.crypto.subtle.importKey(
    "jwk",
    privateKey,
    { name: "RSA-OAEP", hash: { name: "SHA-256" } },
    true,
    ["decrypt"]
  );

  // Encrypt
  const encryptedText = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKeyReloaded,
    encodedText
  );

  document.getElementById("app").innerHTML = `
  <h1>Hello Vanilla!</h1>
  <div>
    <div>Original message: <code>${message}</code></div>
    <div>Encrypted message: <pre>${ab2b64(encryptedText)}</pre>.</div>

    <button id="decrypt-button">Decrypt</button>
    <hr />
    <div><b>Public key:</b> <pre>${publicKeyToString}</pre></div>
    <div><b>Private key:</b> <pre>${privateKeyToString}</pre></div>
  </div>`;

  document
    .getElementById("decrypt-button")
    ?.addEventListener("click", function () {
      decryptMessage(encryptedText, privateKeyReloaded);
    });
};

main().catch((error) => console.log(error));
