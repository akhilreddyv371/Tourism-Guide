const express = require('express')
const route = express.Router({mergeParams : true})
const State = require('../models/state')

route.get('', async (req, res) => {
    const states = await State.find({})
    res.render('State/index', { states })
})



route.get('new', async (req, res) => {
    res.render('State/new')
})

route.get('/:id', async (req, res) =>{
    const {id} = req.params
    const state = await State.findById(id)
    res.render('State/show', {state})
})

route.post('', async (req, res) => {
    const { state, image, description } = req.body.state
    const s = new State({ state, image, description })
    await s.save()
    res.redirect(`/states/${s._id}`)

})

route.put('/:id', async (req, res) => {
    const { id } = req.params
    const state = await State.findByIdAndUpdate(id, { ...req.body.state })
    res.redirect(`/states/${id}`)
})

route.delete('/:id', async (req, res) =>{
    const {id} = req.params
    await State.findByIdAndDelete(id)
    res.redirect('/states')
    // res.send('Worked')
})

route.get('/:id/edit', async (req, res) => {
    const state = await State.findById(req.params.id)
    res.render('State/edit', { state })
})

module.exports = route