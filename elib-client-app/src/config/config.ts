import { config as conf } from "dotenv";
conf();

const _config = {
  backendUrl:process.env.BACKEND_URL
};

export const config = Object.freeze(_config);
