async function getPublicKey() {
    const API_BASE = window.location.origin;
    const res = await fetch(`${API_BASE}/api/auth/public-key`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.publicKey;
}

function pemToArrayBuffer(pem) {
    const base64 = pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function encryptPassword(password) {
    const publicKeyPem = await getPublicKey();
    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        pemToArrayBuffer(publicKeyPem),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
    const encodedPassword = new TextEncoder().encode(password);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        encodedPassword
    );
    return arrayBufferToBase64(encrypted);
}
