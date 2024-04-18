const mongoose = require('mongoose')


reviewSchema = new mongoose.Schema({
    rating : {
        type : Number,
        required : [true, 'Rating cannot be blank']
    },
    body : {
        type : String,
        required : [true, 'Review cannot be bank']
    },
    place : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Place'
    },
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }
})


module.exports = mongoose.model('Review', reviewSchema)
