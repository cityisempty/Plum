import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "./config.js";

export type UserClaims = { typ: "user"; uid: number };
export type AdminClaims = { typ: "admin"; aid: number };

const signOptions: SignOptions = {
  // jsonwebtoken's type narrows this to a branded duration string while the
  // environment value is intentionally configurable at runtime.
  expiresIn: config.jwtTtl as SignOptions["expiresIn"],
};

export function signUser(uid: number): string {
  return jwt.sign({ typ: "user", uid } satisfies UserClaims, config.jwtSecret, signOptions);
}

export function signAdmin(aid: number): string {
  return jwt.sign({ typ: "admin", aid } satisfies AdminClaims, config.jwtSecret, signOptions);
}

export function verifyToken(token: string): UserClaims | AdminClaims {
  const payload = jwt.verify(token, config.jwtSecret) as UserClaims | AdminClaims;
  if (payload.typ !== "user" && payload.typ !== "admin") {
    throw new Error("INVALID_TOKEN");
  }
  return payload;
}
