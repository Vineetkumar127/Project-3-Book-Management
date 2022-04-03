const express = require('express');

const router = express.Router();

const userController = require("../controller/userController")
const bookController = require("../controller/bookController")
const reviewController = require("../controller/reviewController")
const authController = require("../middleWare/auth.js")

// ...................User Api..................

router.post("/register", userController.createUser)

router.post("/login",userController.userLogin )

// ...................Book Api..............................

router.post("/books",authController.authenticate,bookController.createBook)

router.get("/books",authController.authenticate,bookController.getBook)

router.get("/books/:bookId",authController.authenticate, bookController.bookById)

router.put("/books/:bookId",authController.authenticate,authController.authorise,bookController.updateBook)

router.delete("/books/:bookId",authController.authenticate,authController.authorise,bookController.deleteBookById)


//.............................review api.....................................

router.post("/books/:bookId/review", reviewController.createReview )

router.put("/books/:bookId/review/:reviewId", reviewController.updateReview )

router.delete("/books/:bookId/review/:reviewId", reviewController.deleteReview)

module.exports = router;
//adding this comment for nothing