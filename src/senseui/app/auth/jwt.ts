import 'server-only';
import * as jose from 'jose';

const transactionsSecret = new TextEncoder().encode(
    process.env.JWT_TRANSACTIONS_SECRET
);

const alg = 'HS256';

export async function generateTransactionsJwt() {
    return await new jose.SignJWT()
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer(process.env.JWT_ISSUER || '')
        .setAudience(process.env.JWT_TRANSACTIONS_AUDIENCE || '')
        .setExpirationTime('15m')
        .sign(transactionsSecret);
}
