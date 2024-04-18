if(process.env.NODE_ENV != 'production'){
    require('dotenv').config()
}

const mongoose = require('mongoose')
const express = require('express')
const app = express()
const path = require('path')
const State = require('./models/state')
const Place = require('./models/place')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const Review = require('./models/review')
const User = require('./models/user')
const passport = require('passport')
const passportLocal = require('passport-local')
const session = require('express-session')
const flash = require('connect-flash')
const { isLoggedIn } = require('./middleware')
const ExpressError = require('./ErrorHandling/ExpressError')
const catchAsync = require('./ErrorHandling/catchAsync')
const {storage} = require('./cloudinary')
const multer = require('multer')
const upload = multer({storage})
const {cloudinary} = require('./cloudinary')
const {placeSchema, reviewSchema} = require('./Schema')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapBoxToken = process.env.MAPBOX_TOKEN
const geocode = mbxGeocoding({accessToken : mapBoxToken})
const mongoSanitize = require('express-mongo-sanitize')


const sessionOptions = {
    secret: 'thisisnotmysecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure : true,
        expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

// const stateRoute = require('./routes/stateRoute')
// const placeRoute = require('./routes/placeRoute')

mongoose.connect('mongodb://localhost:27017/WebProject', { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"))
db.once("open", () => {
    console.log("Database connected")
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.engine('ejs', ejsMate)

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(session(sessionOptions))
app.use(flash())
app.use(mongoSanitize())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new passportLocal(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(express.static(path.join(__dirname, 'public')))


app.get('/home', (req, res) => {
    res.send('This would be the home page')
})
//middleware 

const validatePlace = (req, res, next) => {
    const {error} = placeSchema.validate(req.body)
    if(error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(400, msg)
    }else{
        next()
    }
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body)
    if(error){
        if(!error.message) msg => error.details.map(el => el.message)
        throw new ExpressError(400, msg)
    }else{
        next()
    }
}

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.get('/', (req, res) => {
    res.render('home')
})
//User routes 

app.get('/register', (req, res) => {
    res.render('User/register')
})

app.post('/register', async (req, res, next) => {
    const { email, username, password } = req.body;
    const user = new User({ email, username })
    const registeredUser = await User.register(user, password)
    req.login(registeredUser, er => {
        if (er) return next(er)
        res.redirect('/states')
    })
})

app.get('/login', (req, res) => {
    res.render('User/login')
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Welcome back')
    res.redirect('/states')
})

app.get('/logout', (req, res, next) => {
    req.logout(req.user, el => {
        if (el) return next(el)
    })
    req.flash('success', 'Logged Out')
    res.redirect('/login')
})
// Review routes

app.post('/states/:id/view/:placeId', isLoggedIn, validateReview ,async (req, res) => {
    // if (req.session.reviewCount === 'NaN') {
    //     req.session.reviewCount = 1
    // } else {
    //     req.session.reviewCount = req.session.reviewCount + 1
    // }
    const { id, placeId } = req.params;
    const place = await Place.findById(placeId);
    const review = new Review({ ...req.body.review })
    place.reviews.push(review)
    review.author = req.user._id;
    await place.save();
    await review.save();
    res.redirect(`/states/${id}/view/${placeId}`)
    // console.log('Review Count : ', req.session.reviewCount)

})

app.delete('/states/:id/view/:placeId/:reviewId', isLoggedIn,async (req, res) => {
    // if (req.session.reviewCount > 0) {
    //     req.session.reviewCount = req.session.reviewCount - 1;
    // } else {
    //     req.session.reviewCount = 0;
    // }

    const { id, placeId, reviewId } = req.params;
    const place = await Place.findByIdAndUpdate(placeId, { $pull: { reviews: reviewId } })
    const review = await Review.findByIdAndDelete(reviewId)
    res.redirect(`/states/${id}/view/${placeId}`)
    // console.log('Review Delete Count : ', req.session.reviewCount)
})

//places routes 

app.get('/states/:id/places/new', isLoggedIn,(req, res) => {
    const { id } = req.params
    res.render('Places/new', { id })
})

app.get('/states/:id/view/:placeId', isLoggedIn, catchAsync(async (req, res) => {
    const { id, placeId } = req.params;
    const place = await Place.findById(placeId).populate('reviews')
    // console.log(place.geometry.coordinates)
    const result = await geocode.forwardGeocode({
        query : `${place.title}, ${place.city}`,
        limit : 1
    }).send()
    // console.log(result.body.features[0])
    // console.log(result.body.features[0].geometry)
    res.render('Places/view', { id, place })
}))

app.get('/states/:id/view/:placeId/edit', isLoggedIn, catchAsync(async (req, res) => {
    const { id, placeId } = req.params;
    const place = await Place.findById(placeId)
    res.render('Places/edit', { place, id })
}))

app.put('/states/:id/view/:placeId',upload.array('image'), validatePlace , catchAsync(async (req, res) => {
    const { id, placeId } = req.params;
    const place = await Place.findByIdAndUpdate(placeId, { ...req.body.place })
    const imgs = req.files.map(f => ({url : f.path, filename : f.filename}))
    place.images.push(...imgs)
    await place.save();
    if(req.body.deleteImages) {
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename)
        }
        await place.updateOne({$pull : {images : {filename : {$in : req.body.deleteImages}}}})
        console.log(place)
    }
    req.flash('success', 'Updated Successfully')
    res.redirect(`/states/${id}/view/${placeId}`)
}))

app.post('/states/:id/places', upload.array('image'), validatePlace , catchAsync(async(req, res) => {
    const { id } = req.params
    const { city, title, description } = req.body.place;
    const state = await State.findById(id)
    const place = new Place({ city, title, description })
    state.place.push(place)
    place.state = state;
    place.images = req.files.map(f => ({url: f.path, filename : f.filename}))
    const result = await geocode.forwardGeocode({
        query : place.city,
        limit : 1
    }).send()
    place.geometry = result.body.features[0].geometry;
    console.log(result.body.features[0].geometry)
    await place.save()
    await state.save()
    console.log(place)
    req.flash('success', 'Added a place')
    res.redirect(`/states/${id}`)
    // res.send(place)
}))

app.delete('/states/:id/:placeId', catchAsync(async(req, res) => {
    const { id, placeId } = req.params;
    // const state = await State.findByIdAndUpdate(id, { $pull: { place: placeId } }) 
    const place = await Place.findById(placeId);
    const img = place.images.map(f => ({url : f.url, filename : f.filename}))
    await place.images.forEach((img, i) => {
        cloudinary.uploader.destroy(img.filename)
    })
    await Place.findByIdAndDelete(placeId)
    req.flash('error', 'sucessfully deleted')
    res.redirect(`/states/${id}`)    
}))

//states routes

app.put('/states/:id', upload.single('image'), catchAsync(async (req, res) => {
    const { id } = req.params
    const state = await State.findByIdAndUpdate(id, { ...req.body.state })
    const img = [req.file.path, req.file.filename]
    state.image = {url : img[0], filename : img[1]}
    await state.save()
    res.redirect(`/states/${id}`)
}))


app.get('/states', isLoggedIn, catchAsync(async (req, res) => {
    const query = req.query.Search;
    // if (!query) {
    //     const states = await State.find()
    //     res.render('State/index', { states })
    // } else {
    //     const states = await State.find({state : query})
    //     const places = await Place.find({})
    //     res.render('State/index', {campgrounds})
    // }
    // const places = await Place.find({})
    // console.log(places)
    const states = await State.find()
    res.render('State/index', {states})
}))

app.get('/states/new', async (req, res) => {
    res.render('State/new')
})

app.get('/states/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params
    const state = await State.findById(id).populate('place')
    if (!state) {
        throw new ExpressError(404, 'State Not Found');
    } else {
        // res.send(state)
        res.render('State/show', { state })
    }

}))


app.post('/states', catchAsync(async (req, res) => {
    const { state, image, description } = req.body.state
    const s = new State({ state, image, description })
    await s.save()
    res.redirect(`/states/${s._id}`)

}))

app.delete('/states/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    await State.findByIdAndDelete(id)
    res.redirect('/states')
}))

app.get('/states/:id/edit', catchAsync(async (req, res) => {
    const state = await State.findById(req.params.id)
    res.render('State/edit', { state })
}))

app.all('*', (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'))
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message } = err;
    if (!err.message) err.message = 'oh no, something went wrong'
    res.status(statusCode).render('error', { err })
})

app.listen(3005, () => {
    console.log('APP LISTENING ON PORT 3002')
})


