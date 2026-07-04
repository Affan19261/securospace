/**
 * SecuroSpace - Cryptographic & Password Security Helper
 * Utilizes the native browser Web Crypto API for secure, zero-knowledge operations.
 */
class SecuroCrypto {
    /**
     * Converts a string to an ArrayBuffer.
     */
    static str2buf(str) {
        return new TextEncoder().encode(str);
    }

    /**
     * Converts an ArrayBuffer to a string.
     */
    static buf2str(buf) {
        return new TextDecoder().decode(buf);
    }

    /**
     * Converts an ArrayBuffer to a Base64 string (call-stack safe for large inputs).
     */
    static buf2base64(buf) {
        const bytes = new Uint8Array(buf);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Converts a Base64 string to an ArrayBuffer (call-stack safe).
     */
    static base642buf(base64) {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Derives an AES-GCM CryptoKey from a raw password string and a salt.
     * @param {string} password - User's master password.
     * @param {Uint8Array} salt - PBKDF2 salt.
     * @returns {Promise<CryptoKey>} - Derived AES-GCM key.
     */
    static async deriveKey(password, salt) {
        const passwordBuffer = this.str2buf(password);
        
        // Import raw password as key material
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        // Derive AES-GCM key from base key
        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false, // Key is not extractable for security
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a plaintext string using a derived key.
     * @param {string} plaintext - Content to encrypt.
     * @param {string} password - Master password to encrypt with.
     * @returns {Promise<{ciphertext: string, salt: string, iv: string}>} - Cryptographic payload.
     */
    static async encrypt(plaintext, password) {
        // Generate a cryptographically random salt (16 bytes) and IV (12 bytes)
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Derive key using salt
        const key = await this.deriveKey(password, salt);
        
        // Encrypt plaintext
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            this.str2buf(plaintext)
        );

        return {
            ciphertext: this.buf2base64(encryptedBuffer),
            salt: this.buf2base64(salt),
            iv: this.buf2base64(iv)
        };
    }

    /**
     * Decrypts a ciphertext payload using a password.
     * @param {string} ciphertext - Encrypted content (base64).
     * @param {string} salt - Salt used for key derivation (base64).
     * @param {string} iv - Initialization vector (base64).
     * @param {string} password - Master password.
     * @returns {Promise<string>} - Decrypted plaintext.
     */
    static async decrypt(ciphertext, salt, iv, password) {
        try {
            const saltBuf = this.base642buf(salt);
            const ivBuf = this.base642buf(iv);
            const ciphertextBuf = this.base642buf(ciphertext);

            // Re-derive the key with same salt and password
            const key = await this.deriveKey(password, saltBuf);

            // Decrypt buffer
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivBuf
                },
                key,
                ciphertextBuf
            );

            return this.buf2str(decryptedBuffer);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Decryption failed. Invalid Master Password or corrupted data.');
        }
    }

    /**
     * Calculates password entropy and evaluates its strength.
     * @param {string} password - Password to analyze.
     * @returns {{entropy: number, strength: string, color: string, feedback: string}}
     */
    static analyzePasswordStrength(password) {
        if (!password) {
            return { entropy: 0, strength: 'None', color: '#ff4d4d', feedback: 'Enter a password to begin.' };
        }

        let poolSize = 0;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33; // Special characters count

        const length = password.length;
        const entropy = length * Math.log2(poolSize || 1);

        let strength = 'Weak';
        let color = '#ff4d4d'; // Soft neon red
        let feedback = 'Weak. Add numbers, symbols, and mixed casing.';

        if (entropy >= 80 && length >= 12) {
            strength = 'Excellent';
            color = '#00e676'; // Neon emerald green
            feedback = 'Excellent security strength! Keep this password safe.';
        } else if (entropy >= 60 && length >= 10) {
            strength = 'Strong';
            color = '#2979ff'; // Bright electric blue
            feedback = 'Strong security key. Highly resilient to brute-force attacks.';
        } else if (entropy >= 40 && length >= 8) {
            strength = 'Medium';
            color = '#ff9100'; // Electric orange
            feedback = 'Medium strength. Consider making it longer for better safety.';
        }

        return {
            entropy: Math.round(entropy),
            strength,
            color,
            feedback
        };
    }
}
