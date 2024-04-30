import express from "express";
import path from "node:path";
import { createBook, listBooks, updateBook } from "./bookController";
import multer from "multer";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../../public/data/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.originalname.replace(/\.[^/.]+$/, "") +
        "-" +
        uniqueSuffix +
        "." +
        file.mimetype.split("/")[-1]
    );
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, //10mb
  },
});

bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

bookRouter.patch(
  "/:bookId",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/", authenticate, listBooks);

export default bookRouter;
