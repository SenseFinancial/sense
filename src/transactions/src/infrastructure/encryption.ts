import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Configuration } from './configuration';

@Injectable()
export class Encryption {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer<ArrayBuffer>;

    constructor(private readonly configuration: Configuration) {
        const keyString = configuration.getEncryptionKey();
        this.key = Buffer.from(keyString, 'hex');
    }

    encrypt(text: string): { encrypted: string; iv: string; tag: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: cipher.getAuthTag().toString('hex'),
        };
    }

    decrypt(encrypted: string, iv: string, tag: string): string {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(iv, 'hex'),
        );
        decipher.setAuthTag(Buffer.from(tag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}