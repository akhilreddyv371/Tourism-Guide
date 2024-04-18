const mongoose = require('mongoose')
const Review = require('./review')

const ImageSchema = new mongoose.Schema({
    url : String,
    filename : String
})

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
})

const placeSchema = new mongoose.Schema({
    city: String,
    title: {
        type: String,
        required : [true, 'Title cannot be blank']
    },
    images: [ImageSchema],
    description: String,
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    },
    geometry : {
        type : {
            type : String,
            enum : ['Point'],
            required : true
        },
        coordinates : {
            type: [Number],
            required : true
        }
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User' 
    }
})

// placeSchema.virtual('properties.popUpMarkup').get(function() {
//     return `<a href=/places/${this._id}>${this.city}</a>`
// })

placeSchema.post('findOneAndDelete', async function(place) {
    if(place.reviews.length) {
        await Review.deleteMany({_id : {$in : place.reviews}})
    }
})

module.exports = mongoose.model('Place', placeSchema)



