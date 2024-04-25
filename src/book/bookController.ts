import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import fs from "node:fs";
import bookModel from "./bookModel";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  //   console.log("files", req.files);
  const { title, genre } = req.body;

  const files = req.files as { [fileName: string]: Express.Multer.File[] };

  //   upload book cover to cloudinary bucket called book-covers
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );
  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });
    console.log("uploadResult", uploadResult);

    //upload pdf of book to cloudinary bucker call books

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );
    const bookUploadResult = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: bookFileName,
      folder: "book-pdfs",
      format: "pdf",
    });
    console.log("bookUploadResult", bookUploadResult);

    //create book
    const newBook = await bookModel.create({
      title,
      genre,
      author: "661eed1e6b02b43e6c418736",
      coverImage: uploadResult.secure_url,
      file: bookUploadResult.secure_url,
    });

    //delete temp files

    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);
    //   throw new  Error("Files not deleted successfully");
    } catch (err) {
        res.status(291).json({ id: newBook._id });
        return;
    }

    res.status(201).json({ id: newBook._id });
  } catch (error) {
    return next(createHttpError(500, "Failed to upload image or PDF"));
  }
};

export { createBook };
