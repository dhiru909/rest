import Banner from '@/app/(home)/components/Banner'
import Image from 'next/image'
import BookList from './components/BookList'
import { log } from 'console'
import { config } from '@/config/config'

export default async function Home() {
    const response = await fetch(`${config.backendUrl}/books`)
    if (!response.ok) {
        throw new Error('Could not get books')
    }
    const books = await response.json()
    return (
        <>
            <Banner />
            <BookList books={books} />
        </>
    )
}
