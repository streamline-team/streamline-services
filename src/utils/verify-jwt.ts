import jwks from "jwks-rsa";
import jwt, { JwtHeader, SigningKeyCallback, JwtPayload } from "jsonwebtoken";
import { ActionResponse } from "config/types";

const verifyJwt = async (
  authHeader: string | null
): ActionResponse<JwtPayload> => {
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isError: true,
        data: "Invalid credentials",
        code: 401,
      };
    }

    const bearer = authHeader.split("Bearer ")[1];

    const jwkClient = jwks({
      jwksUri: "https://streamline-staging.eu.kinde.com/.well-known/jwks",
    });

    const getKey = (header: JwtHeader, callback: SigningKeyCallback): void => {
      jwkClient.getSigningKey(header.kid, function (err, key) {
        if (err) {
          return callback(err);
        }

        if (!key) {
          return callback(new Error("No signing key available"));
        }

        callback(null, key.getPublicKey());
      });
    };

    const decodedToken = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(bearer, getKey, {}, (err, decoded) => {
        if (err) reject(err);

        if (!decoded || typeof decoded === "string") {
          return reject(new Error("JWT payload could not be allocated"));
        }

        resolve(decoded);
      });
    });

    return {
      isError: false,
      data: decodedToken,
    };
  } catch (e) {
    return {
      isError: true,
      data: "Unable to verify JWT",
      code: 401,
    };
  }
};

export default verifyJwt;
