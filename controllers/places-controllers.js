const HttpError = require("../models/http-errors");
const uuid = require("uuid/v4");
const mongoose = require("mongoose");

const {validationResult} = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");



const getPlaceById = async (req, res, next) => { // only /api/places/:pid will trigger this. NOTHING ELSE
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId); // does not return a promise. you can get a promise if you add .exec()
    } catch (err) {
        const error = new HttpError("Something went wrong. Could not find a place with the given id", 500);
        return next(error); // return next error to stop code execution
        // this error is for errors with the get request
    }

    if (!place) { // for async use next()
        const error = new HttpError("Could not find a place for the given id!", 404);
        return next(error);
    } // with the return statement here, no code after is executed so we stop at the 404

    res.json({place: place.toObject({getters: true})}); // getters removes the _ from the id.
};


const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    let places;
    try {
        places = await Place.find({creator: userId}); // this finds places where the creator property matches the userId
        // find returns an array
    } catch (err) {
        const error = new HttpError("Fetching places failed. Try again!", 500);
        return next(error); // return next error to stop code execution
        // this error is for errors with the get request
    }

    if (!places || places.length === 0) {
        return next(new HttpError("Could not find places for the given user id!", 404));
    }

    res.json({places: places.map(place => place.toObject({getters: true}))}) // because find returns an array, we cant use toObject on an array
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req); // this will check the validators written in places-routes
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs given, please check your data.", 422));
    }

    const { title, description, address, creator } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error)
    }
    
    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Empire_State_Building_from_the_Top_of_the_Rock.jpg/220px-Empire_State_Building_from_the_Top_of_the_Rock.jpg",
        creator
    });

    let user;

    try {
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError("Creating place failed.", 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError("Could not find user for provided id", 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session: sess}); // we need a session here and now we save the place
        // now we need to make sure the placeId is store with the user
        user.places.push(createdPlace); // push is a mongoose method, not the JS method. only adds the placeId
        await user.save({session: sess});
        await sess.commitTransaction(); // at this point the changes have been made to the db

    } catch (err) {
        const error = new HttpError("Creating place failed. Try again", 500);
        return next(error); // this needs to be added so that the code execution stops when the error occurs
    }

    // 201 - successfully created something on the server
    res.status(201).json({place: createdPlace});
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req); // this will check the validators written in places-routes
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs given, please check your data.", 422));
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError("Something went wrong. Could not update place", 500);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError("Something went wrong, could not update place", 500);
        return next(error);
    }

    res.status(200).json({place: place.toObject({getters: true})});
};

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId).populate("creator"); // we can use populate only if the connections in user and place are established
    } catch (err) {
        const error = new HttpError("Something went wrong. Could not delete place", 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError("Could not find a place for this id", 404);
        return next(error);
    }

    try { // for saving and deleting the data we use try catch blocks
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess}); // removing/ saving is an async task. thats why we need await
        place.creator.places.pull(place); // pull will remove the id.
        await place.creator.save({session: sess}); // we need to save our new place
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError("Something went wrong. Could not delete place", 500);
        return next(error);
    }

    res.status(200).json({message: "Deleted place"});
};


exports.getPlaceById = getPlaceById; // express will execute it when a request comes in
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
