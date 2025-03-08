import  * as dotenv from "dotenv";

// LOAD ENVIRONMENT VARIABLES
dotenv.config({
  path: ".env",
});

// GLOBAL VARIABLES
const _config = {
  port: process.env.PORT || 8000,
  dbName: process.env.DB_NAME,
  mongoDbUri: process.env.MONGODB_URI,
  crossOrigin: process.env.CORS_ORIGIN,
  jwtAccessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  jwtAccessTokenSecretExpiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRY as string,
  jwtRefreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  jwtRefreshTokenSecretExpiresIn: process.env.REFRESH_TOKEN_SECRET_EXPIRY,
}

export const config = Object.freeze(_config);