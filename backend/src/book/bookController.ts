import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import fs from "node:fs";
import bookModel from "./bookModel";
import { AuthRequest } from "../middlewares/authenticate";
import { stringify } from "node:querystring";

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
      res.status(201).json({ id: newBook._id });
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
      // delete previous image
      const coverFileSplits = book.coverImage.split("/");
      // console.log(coverFileSplits.at(-1));
      const fileSplit = coverFileSplits.at(-1)?.split(".").at(-2);
      // console.log(fileSplit);
      const public_id = coverFileSplits.at(-2) + "/" + fileSplit;
      // console.log(public_id);
      await cloudinary.uploader.destroy(public_id, function (error, _result) {
        if (error) {
          console.log("ERROR IN DELETING IMAGE FROM CLOUDINARY", error);
        } else {
          console.log(
            "IMAGE HAS BEEN DELETED FROM CLOUDINARY SUCCESSFULLY ",
            _result
          );
        }
      });
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

      // delete previous pdf file from cloudinary
      const pdfFileSplits = book.file.split("/");
      // console.log(pdfFileSplits);
      const pdfFile = pdfFileSplits.at(-1);
      // console.log(pdfFile);
      const public_id_pdf = pdfFileSplits.at(-2) + "/" + pdfFile;
      // console.log(public_id_pdf);
      await cloudinary.uploader.destroy(
        public_id_pdf,
        {
          resource_type: "raw",
        },
        function (error, _result) {
          if (error) {
            console.log("ERROR IN DELETING IMAGE FROM CLOUDINARY", error);
          } else {
            console.log(
              "IMAGE HAS BEEN DELETED FROM CLOUDINARY SUCCESSFULLY ",
              _result
            );
          }
        }
      );
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
      },
      {
        new: true,
      }
    );

    res.json(updatedBook);
  } catch (error) {
    return next(createHttpError(500, "Failed to update book"));
  }
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // p = page
    // l = limit
    let page = parseInt(req.query.p as string) || 1;
    let limit = parseInt(req.query.l as string) || 20;
    // console.log("page", page);
    const booksCount = await bookModel.countDocuments();
    const pagesCount = Math.ceil(booksCount / limit);
    // console.log("page Count",booksCount);
    
    if (page < 1) {
      page = 1;
    } else {
      page = Math.min(page, pagesCount);
      if(page==0){
        page = 1;
      }
    }
    // console.log("page", page);
    const skip = (page - 1) * limit;
    const books = await bookModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort([["createdAt", "desc"]])
      .exec();
    res.set(
      "X-Pagination",
      JSON.stringify({ totalPages: pagesCount, currentPage: page })
    );
    res.status(200).send(books);
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while getting books"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { bookId } = req.params;
  try {
    const book = await bookModel.findById(bookId).populate("user");
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    // console.log(book.author.toString());
    res.status(200).send(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const { bookId } = req.params;
  try {
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    //check access
    if ((req as AuthRequest).userId !== book.author.toString()) {
      return next(createHttpError(403, "you can not delete this book"));
    }
    //delete cover image from cloudinary
    const coverFileSplits = book.coverImage.split("/");
    // console.log(coverFileSplits.at(-1));
    const fileSplit = coverFileSplits.at(-1)?.split(".").at(-2);
    // console.log(fileSplit);
    const public_id = coverFileSplits.at(-2) + "/" + fileSplit;
    // console.log(public_id);
    await cloudinary.uploader.destroy(public_id, function (error, _result) {
      if (error) {
        console.log("ERROR IN DELETING IMAGE FROM CLOUDINARY", error);
      } else {
        console.log(
          "IMAGE HAS BEEN DELETED FROM CLOUDINARY SUCCESSFULLY ",
          _result
        );
      }
    });

    // delete pdf file from cloudinary
    const pdfFileSplits = book.file.split("/");
    console.log(pdfFileSplits);
    const pdfFile = pdfFileSplits.at(-1);
    console.log(pdfFile);
    const public_id_pdf = pdfFileSplits.at(-2) + "/" + pdfFile;
    console.log(public_id_pdf);
    await cloudinary.uploader.destroy(
      public_id_pdf,
      {
        resource_type: "raw",
      },
      function (error, _result) {
        if (error) {
          console.log("ERROR IN DELETING IMAGE FROM CLOUDINARY", error);
        } else {
          console.log(
            "IMAGE HAS BEEN DELETED FROM CLOUDINARY SUCCESSFULLY ",
            _result
          );
        }
      }
    );
    const result = await bookModel.deleteOne({ _id: bookId }).exec();
    res.sendStatus(204);
  } catch (error) {
    return next(createHttpError(500, "Error while deleting books"));
  }
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
