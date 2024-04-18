const Joi = require('joi')
// const sanitizeHtml = require('sanitize-html')


// const Joi = BaseJoi.extend(extension())

module.exports.placeSchema = Joi.object({
    place : Joi.object({
        city : Joi.string().required(),
        title : Joi.string().required(),
        description : Joi.string().required(),
    }).required(),
    deleteImages : Joi.array()
})

module.exports.reviewSchema = Joi.object({
    review : Joi.object({
        rating : Joi.number().min(1).max(5).required(),
        body : Joi.string().required()
    }).required()
})
