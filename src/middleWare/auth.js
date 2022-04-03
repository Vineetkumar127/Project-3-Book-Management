const jwt = require('jsonwebtoken')
const { default: mongoose } = require('mongoose')
const bookModel = require('../models/bookModel')

const authenticate = async function(req, res, next){
    try{
        const token = req.headers['group17']
        const secretKey = "group17project3almostdone"

        if(!token){
        return res.status(400).send({status: false, message : "Please provide token"})
        }

        const decodedToken = jwt.verify(token, secretKey) 

        if(!decodedToken){
        return res.status(401).send({status : false, message: "authentication failed"})
        }

        let time = Math.floor(Date.now()/1000)
        if(decodedToken.exp< time){
            return res.status(401).send({status: false, message: "Token is expired Relogin"})
        }
        // setting a key in request,  "decodedToken" which consist userId and exp.
        req.decodedToken = decodedToken
        
        next()

    }catch(err){
       
        res.status(500).send({error : err.message})
    }
}

const authorise = async function(req, res,next){
    try{
        const bookId = req.params.bookId
        const decodedToken = req.decodedToken

        let time = Math.floor(Date.now()/1000)

        if(decodedToken.exp< time){
            
            return res.status(401).send({status: false, message: "Token is expired Relogin"})
        }
       
        if(mongoose.Types.ObjectId.isValid(bookId) == false){
        return res.status(400).send({status : false, message : "bookId is not valid"})
        }

        const book = await bookModel.findOne({_id : bookId, isDeleted : false})

        if(!book){
        return res.status(404).send({status : false, message : "Book has already been deleted"})    
        }

        if((decodedToken.userId != book.userId)){
        return res.status(403).send({status : false, message : "unauthorized access"})
        }
                
        next()

    }catch(err){
        res.status(500).send({error : err.message})
    }
}

module.exports.authenticate = authenticate
module.exports.authorise = authorise


    
