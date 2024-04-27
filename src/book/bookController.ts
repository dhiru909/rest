import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import fs from "node:fs";
import bookModel from "./bookModel";
import { AuthRequest } from "../middlewares/authenticate";

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
    // console.log("uploadResult", uploadResult);

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
    // console.log("bookUploadResult", bookUploadResult);
    const _req = req as AuthRequest;
    //create book
    const newBook = await bookModel.create({
      title,
      genre,

      author: _req.userId,
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [fileName: string]: Express.Multer.File[] };
  let { title, genre } = req.body;
  const { bookId } = req.params;
  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "No such book found"));
    // return res.status(404).json({ message: "Book not found" });
  }

  if (book.author.toString() !== (req as AuthRequest).userId) {
    return next(
      createHttpError(403, "You are not allowed to update this book")
    );
  }
  try {
    let coverImageUrl = "";

    if (files.coverImage) {
      const coverFileName = files.coverImage[0].filename;
      const coverFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverFileName
      );
      const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);

      const coverImageUploadResult = await cloudinary.uploader.upload(
        coverFilePath,
        {
          filename_override: coverFileName,
          folder: "book-covers",
          format: coverImageMimeType,
        }
      );
      try {
        await fs.promises.unlink(coverFilePath);
      } catch (err) {}
      // console.log("uploadResult", coverImageUploadResult);
      coverImageUrl = coverImageUploadResult.secure_url;
    }

    //upload pdf of book to cloudinary bucket call books
    let bookUrl = "";
    if (files.file) {
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
      bookUrl = bookUploadResult.secure_url;
      try {
        await fs.promises.unlink(bookFilePath);
      } catch (err) {}
    }
    if (!title) {
      title = book.title;
    }
    if (!genre) {
      genre = book.genre;
    }
    const updatedBook = await bookModel.findOneAndUpdate(
      {
        _id: bookId,
      },
      {
        title,
        genre,
        coverImage: coverImageUrl || book.coverImage,
        file: bookUrl || book.file,
      },{
        new:true
      }
    );
    res.json(updatedBook);
  } catch (error) {
    return next(createHttpError(500, "Failed to update book"));
  }

 
};

export { createBook, updateBook };
