import { Injectable } from "@nestjs/common";
import { jwtVerify, JWTVerifyOptions } from 'jose';
import { Configuration } from "./configuration";

@Injectable()
export class Authentication {
    verifyOptions: JWTVerifyOptions;
    secret: Uint8Array<ArrayBufferLike>;

    constructor(private readonly configuration: Configuration) {
        this.secret = new TextEncoder().encode(configuration.getJwtSecret());

        this.verifyOptions = {
            issuer: configuration.getJwtIssuer(),
            audience: configuration.getJwtAudience(),
            algorithms: ['HS256'],   // accept only what you expect
        };
    }

    verifyJwt = async (token: string) => {
        if (token && token.indexOf('Bearer') >= 0)
            token = token.substring('Bearer '.length);

        await jwtVerify(token, this.secret, this.verifyOptions);
    }
}