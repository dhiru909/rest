import { config as conf } from "dotenv";
conf();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
  jwtSecret:process.env.JWT_SECRET,
  cloudinaryName: process.env.CLOUDINARY_NAME || 'dummy',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || 'dummy',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || 'dummy',
  frontendDomain:process.env.FRONTEND_DOMAIN
};

export const config = Object.freeze(_config);
