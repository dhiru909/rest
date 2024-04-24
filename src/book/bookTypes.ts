import { User } from "../user/userTypes";

export interface Book {
  _id: string;
  tile: string;
  author: User;
  genre: string;
  coverImage: string;
  file: string;
  createdAt: Date;
  updatedAt: Date;
}