const express = require('express')
const route = express.Router({mergeParams : true})
const Place = require('../models/place')
const State = require('../models/state')


route.get('/places/new', async(req, res) =>{
    const {id} = req.params 
    const state = await State.findById(id)
    res.render('Places/new', {state})

})

module.exports = route