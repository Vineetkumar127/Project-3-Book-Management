const reviewModel = require("../models/reviewModel")
const bookModel = require("../models/bookModel")
const mongoose = require('mongoose')
const ObjectId = require("mongoose").Types.ObjectId


const isValidDate = (date) => {
    const specificDate = new Date(date);
    const today = new Date();
    return specificDate < today;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId.trim())
}

const isValid = function (value) {
    if (typeof value === undefined || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

// ....................eigth Api Create Review..............................................................

const createReview = async function (req, res) {
    let data = req.body
    let bookId = req.params.bookId

    if (!isValidRequestBody(data)) {
        return res.status(400).send({ status: false, message: "data is required" })
    }

    if (!isValidObjectId(bookId)) {
        return res.status(400).send({ status: false, message: "bookId is not valid" })
    }

    if (!isValid(bookId)) {
        return res.status(400).send({ status: false, error: 'Book id cannot be empty' })
    }



    // let { booksId,reviewedBy,reviewedAt,rating,review }=data


    const checkBookId = await bookModel.findOne({ _id: bookId, isDeleted: false })

    if (!checkBookId)
        return res.status(400).send({ status: false, message: "bookId not found" })

    //if(!isValid(data.reviewedBy)){return res.status(400).send({status: false, message:"reviewedBy is required"})}

    if (!isValidDate(data.reviewedAt)) {
        return res.status(400).send({ status: false, message: "reviewedAt is required" })
    }

    if (!isValid(data.rating)) {
        return res.status(400).send({ status: false, message: "rating is required" })
    }

    if (!(/^[1-5]$/.test(data.rating))) {
        return res.status(400).send({ status: false, message: "please enter rating between 1 to 5" })
    }

    if (!isValid(data.review)) {
        return res.status(400).send({ status: false, message: "review is required" })
    }

    const revieweddata = {
        bookId: bookId, reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt, rating: data.rating, review: data.review
    }

    const reviewData = await reviewModel.create(revieweddata)

    let increasedreview = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false },
        { $inc: { reviews: 1 } }, { new: true })

    return res.status(201).send({ status: true, data: reviewData })

    // return res.status(201).send({status: true, message: reviewData})

}

// .....................Ninth Api Update Review...........................................................

const updateReview = async function (req, res) {
    try {

        let bookId = req.params.bookId
        let reviewId = req.params.reviewId

        let data = req.body
        let reviewToBeUpdated = {}

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "data is required" })
        }

        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "enter valid bookId" })
        }

        if (!isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "enter valid reviewId" })
        }

        let booksId = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!booksId) {
            return res.status(400).res.send({ status: false, message: 'Please provide book Id' })
        }

        let upReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!upReview) {
            return res.status(400).send({ status: false, message: "review is already deleted" })
        }

        if (isValid(data.review)) { reviewToBeUpdated['review'] = data.review }

        let checkreview = await reviewModel.findOne({review:data.review})
        if(checkreview){
            return res.status(400).send({ status: false, ERROR: "the review you want to update is already updated" })
        }

        if (isValid(data.rating)) { reviewToBeUpdated['rating'] = data.rating }
        // let checkrating = await reviewModel.findOne({rating:data.rating})
        // if(checkrating){
        //     return res.status(400).send({ status: false, ERROR: "the rating you want to update is already updated" })
        // }

        if (!(/^[1-5]$/.test(data.rating))) {
            return res.status(400).send({ status: false, message: "please enter rating between 1 to 5" })
        }

        if (isValid(data.reviewedBy)) { reviewToBeUpdated['reviewedBy'] = data.reviewedBy }


        let updatedReview = await reviewModel
            .findOneAndUpdate({ _id: reviewId },
                { review: data.review, rating: data.rating, reviewedBy: data.reviewedBy }, { new: true })

        return res.status(202).send({ Status: "review updated successfully", updatedReview })

    }

    catch (err) {
        return res.status(500).send({ ERROR: err.message })
    }

}

// .........................Tenth Api Delete Review....................................................

const deleteReview = async function (req, res) {
    try {
        const bookid = req.params.bookId
        const reviewid = req.params.reviewId

        if (!isValid(bookid)) {
            return res.status(400).send({ Status: false, message: "Book Id is required" })
        }

        if (!isValid(reviewid)) {
            return res.status(400).send({ status: false, message: "Review Id is required" })
        }

        if (!isValidRequestBody(bookid)) {
            return res.status(400).send({ status: false, message: 'book id is required' })
        }

        if (!isValidRequestBody(reviewid)) {
            return res.status(400).send({ status: false, message: 'review id is required' })
        }

        if (!isValidObjectId(bookid)) {
            return res.status(400).send({ status: false, message: 'book id is not valid' })
        }

        if (!isValidObjectId(reviewid)) {
            return res.status(400).send({ status: false, message: 'review id is not valid' })
        }

        let bookDetails = await bookModel.findOne({ _id: bookid, isDeleted: false })

        if (!bookDetails) {
            return res.status(404).send({ status: false, msg: "book not exist with this bookId" })
        }
        let reviewDetails = await reviewModel.findOne({ _id: reviewid, isDeleted: false })
        if (!reviewDetails) {
            return res.status(404).send({ status: false, msg: "review not exist with this reviewid" })
        }
        const deletereview = await reviewModel
            .findOneAndUpdate({ _id: reviewid, bookId: bookid },
                { $set: { isDeleted: true, deletedAt: Date.now() } })
        let deleteReview = await bookModel.findOneAndUpdate({ _id: bookDetails._id }, { $inc: { reviews: -1 } })

        return res.status(200).send({ Status: true, msg: "Requested review has been deleted." })



    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


module.exports.createReview = createReview
module.exports.updateReview = updateReview
module.exports.deleteReview = deleteReview