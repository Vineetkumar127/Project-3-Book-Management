const userModel = require('../models/userModel')
const bookModel = require('../models/bookModel')
const mongoose = require('mongoose')
const reviewModel = require('../models/reviewModel')


// ...................Function Validation.................................................


const isValid = function (value) {
    if (typeof value == undefined || value == null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidDate = (date) => {
    const specificDate = new Date(date).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    return specificDate < today;
}
const isValidobjectId = (objectId) => {
    return mongoose.Types.ObjectId.isValid(objectId.trim())
}


//................................Third Api createBook...........................................
const createBook = async function (req, res) {
    try {
        const data = req.body
        const query = req.query

        const { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt } = data


        if (isValidRequestBody(query)) {
            return res.status(400).send({ status: false, error: 'this is not allowed' })
        }

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, error: 'please insert valid data' })
        }



        // vaidations for data
        if (!isValidDate(releasedAt)) {
            return res.status(400).send({ status: false, error: 'released is required' })
        }
        if (!isValid(title)) {
            return res.status(400).send({ status: false, error: 'title is required' })
        }
        if (!isValid(excerpt)) {
            return res.status(400).send({ status: false, error: 'excerpt is reuired' })
        }
        if (!isValid(userId)) {
            return res.status(400).send({ status: false, error: 'userId is required' })
        }
        if (!isValidobjectId(userId)) {
            return res.status(400).send({ status: false, message: `enter a valid userId` })
        }

        if (!isValid(ISBN)) {
            return res.status(400).send({ status: false, error: 'ISBN is required' })
        }
        if (!/^(97(8|9))?\d{9}(\d|X)$/.test(ISBN.split("-").join(""))) {
            return res.status(400).send({ status: false, message: `enter a valid ISBN of 13 digits` })
        }

        if (!isValid(category)) {
            return res.status(400).send({ status: false, error: 'category is required' })
        }
        if (!isValid(subcategory)) {
            return res.status(400).send({ status: false, error: 'subcategory is required' })
        }


        if (!(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(releasedAt))) {
            return res.status(400).send({ status: false, message: 'not invalid format, please enter date in YYYY-MM-DD format' })

        }

        // for dublicate data

        const duplicateTitle = await bookModel.findOne({ title })
        if (duplicateTitle) {
            return res.status(400).send({ error: 'this title already exist' })
        }

        const duplicateISBN = await bookModel.findOne({ ISBN })
        if (duplicateISBN) {
            return res.status(400).send({ error: 'ISBN already exist' })
        }



        const bookBody = { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt }



        let savedBook = await bookModel.create(bookBody)
        return res.status(201).send({ status: true, data: savedBook })

    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//....................................fourth Api get book................................................


const getBook = async function (req, res) {
    try {

        const data = req.body
        const query = req.query
        const filter = { isDeleted: false }




        if (isValidRequestBody(data)) {
            return res.status(400).send({ status: false, error: 'this is not allowed' })
        }
       

        if (isValidRequestBody(query)) {
            const { userId, category, subcategory } = query

            if (req.query.userId) {
                if (!(isValid(req.query.userId) && isValidobjectId(req.query.userId))) {
                    return res.status(400).send({ status: false, error: 'userId not valid' })

                }
                filter['userId'] = req.query.userId
            }
            if (isValid(category)) {
                const cateogrised = await bookModel.find({ category })
                if (cateogrised) { filter['category'] = category.trim() }
            }
            if (isValid(subcategory)) {
                const subcat = await bookModel.find({ subcategory })
                if (subcat) { filter['subcategory'] = subcategory.trim() }

            }

        }


        const books = await bookModel.find(filter)
            .select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })

        if (books.length === 0) {
            return res.status(400).send({ status: false, error: 'No Books found' })
        }

        const allbook = books.sort(function (a, b) { return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1 })

        return res.status(200).send({ status: true, bookList: allbook })


    }

    catch (err) { return res.status(500).send({ status: false, error: err.message }) }
}


//.........................Fifth Api book By iD.............................................................

const bookById = async function (req, res) {
    try {
        const bookId = req.params.bookId

        if (!isValidobjectId(bookId)) {
            return res.status(400).send({ status: false, message: `${bookId}in not a Valid BookId` })
        }
        const book = await bookModel.findById({ _id: bookId, isDeleted: false });
        if (!book) {
            return res.status(404).send({ status: false, message: `book does not exit` })
        }
        const reviews = await reviewModel.find({ bookId: bookId, isDeleted: false })

        const data = book.toObject()
        data[`reviewsData`] = reviews
        return res.status(200).send({ status: true, message: `Success`, data: data });

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//......................................sixth Api updateBook by Id...............................

// this API for Update Book

const updateBook = async function (req, res) {
    try {

        let bookId = req.params.bookId
        let data = req.body
        let filter = {}
        let bookToBeModified = await bookModel.findById(bookId)
        if (bookToBeModified) {




            if (Object.keys(data) != 0) {


                if (bookToBeModified.isDeleted == false) {


                    if (isValid(data.title)) { filter['title'] = data.title }

                    let checkTitle = await bookModel.findOne({ title: data.title })
                    if (checkTitle) {
                        return res.status(400).send({ status: false, ERROR: "the title you want to update is already updated" })
                    }


                    let checkexcerpt = await bookModel.findOne({ excerpt: data.excerpt })
                    if (checkexcerpt) {
                        return res.status(400).send({ status: false, ERROR: "the excerpt you want to update is alreadu updated" })
                    }

                    let checkreleasedAt = await bookModel.findOne({ releasedAt: data.releasedAt })
                    if (checkreleasedAt) {
                        return res.status(400).send({ status: false, ERROR: "the releasedAt you want to update is alreadu updated" })
                    }

                    let checkISBN = await bookModel.findOne({ ISBN: data.ISBN })
                    if (checkISBN) {
                        return res.status(400).send({ status: false, ERROR: "the ISBN you want to update is alreadu updated" })
                    }

                    if (isValid(data.title)) { filter['title'] = data.title }
                    if (isValid(data.excerpt)) { filter['excerpt'] = data.excerpt }
                    if (isValid(data.releasedAt)) { filter['releasedAt'] = data.releasedAt }
                    if (isValid(data.ISBN)) { filter['ISBN'] = data.ISBN }



                    let updatedBook = await bookModel
                        .findOneAndUpdate({ _id: bookId }, { title: data.title, excerpt: data.excerpt, releasedAt: data.releasedAt, ISBN: data.ISBN }, { new: true })

                    return res.status(202).send({ Status: "Book updated successfully", updatedBook })

                }
                else {
                    return res.status(400).send({ ERROR: "Book requested has been deleted" })
                }
            }
            else {
                return res.status(400).send({ ERROR: "Bad Request" })
            }


        } else { return res.status(404).send({ ERROR: "Book not found" }) }
    }
    catch (err) {
        return res.status(500).send({ ERROR: err.message })
    }

}


//.....................................Seventh Api deleteBook By Id.........................................


let deleteBookById = async function (req, res) {

    try {
        let id = req.params.bookId

        if (id) {
            let bookToBeDeleted = await bookModel.findById(id)

            if (bookToBeDeleted.isDeleted == true) {
                return res.status(400).send({ status: false, msg: "Book has already been deleted" })
            }


            let deletedBook = await bookModel
                .findOneAndUpdate({ _id: id },
                    { $set: { isDeleted: true, deletedAt: Date.now() } })

            return res.status(200).send({ Status: true, msg: "Requested book has been deleted." })

        } else {
            return res.status(400).send({ ERROR: 'BAD REQUEST' })
        }


    }
    catch (err) {
        return res.status(500).send({ ERROR: err.message })
    }


}


module.exports.createBook = createBook
module.exports.getBook = getBook
module.exports.bookById = bookById
module.exports.updateBook = updateBook
module.exports.deleteBookBy