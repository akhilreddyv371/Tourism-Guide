const mongoose = require('mongoose')
const State = require('../models/state');
const {state} = require('./camp')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { cloudinary } = require('../cloudinary');
// const mapBoxToken = process.env.MAPBOX_TOKEN
const geocode = mbxGeocoding({accessToken : 'pk.eyJ1IjoiYWtoaWxyZWRkeXYiLCJhIjoiY2xkemNoemc2MTBhejNucWpsc3hhNXQwcSJ9.KvHIsAVrZJFF4xWX0ibwmA'})


mongoose.connect('mongodb://localhost:27017/WebProject', { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"))
db.once("open", () => {
    console.log("Database connected")
})

const seedDB = async () => {
    // await State.deleteMany({})
    for (let i = 0; i < 28; i++) {
        const result = await geocode.forwardGeocode({
            query : state[i],
            limit : 1
        }).send()
       
        const camp = new State({
            state: state[i],
            geometry : result.body.features[0].geometry
        })  
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
    console.log('Connection Closed')
})
