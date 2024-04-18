const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const options = {toJson : {virtuals : true}}
// const Place = require('./place')


const stateSchema = new Schema({
    state: String,
    image: {
        url:String,
        filename : String
    },
    description: String,
    place: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Place'
        }
    ],
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
}, options)

stateSchema.virtual('properties.popUpMarkup').get(function() {
    return `<a href=/states/${this._id}>${this.state}</a>`
})

// stateSchema.post('findOneAndDelete', async function(state) {
//     if(state.place.length){
//         await Place.deleteMany(_id, {$in : state.place })
//     }
// })

module.exports = mongoose.model('State', stateSchema)
