import { Book } from '@/types/indes'
import React from 'react'

const BookList = ({ books }: { books: Book[] }) => {
    return (
        <div>
            {books.map((book) => (
                <h1 key={book._id}>{book.title}</h1>
            ))}
        </div>
    )
}

export default BookList
