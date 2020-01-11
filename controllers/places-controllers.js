const HttpError = require("../models/http-errors");
const uuid = require("uuid/v4");

const {validationResult} = require("express-validator");
const getCoordsForAddress = require("../util/location");

let DUMMY_PLACES = [
    {
        id: "p1",
        title: "Empire State Building",
        description: "Tall building",
        location: {
            lat: 40.7484474,
            lng: -73.9871516
        },
        address: "New York",
        creator: "u1"
    }
];

const getPlaceById = (req, res, next) => { // only /api/places/:pid will trigger this. NOTHING ELSE
    const placeId = req.params.pid;
    const place = DUMMY_PLACES.find(place=>place.id === placeId);

    if (!place) { // for async use next()
        throw new HttpError("Could not find a place for the given id!", 404);
    } // with the return statement here, no code after is executed so we stop at the 404

    res.json({place});
};


const getPlacesByUserId = (req, res, next) => {
    const userId = req.params.uid;
    const places = DUMMY_PLACES.filter(p=>p.creator === userId);

    if (!places || places.length === 0) {
        return next(new HttpError("Could not find places for the given user id!", 404));
    }

    res.json({places})
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
    
    const createdPlace = {
        id: uuid(),
        title,
        description,
        location: coordinates,
        address,
        creator
    };

    DUMMY_PLACES.push(createdPlace);
    // 201 - successfully created something on the server
    res.status(201).json({place: createdPlace});
};

const updatePlace = (req, res, next) => {
    const errors = validationResult(req); // this will check the validators written in places-routes
    if (!errors.isEmpty()) {
        throw new HttpError("Invalid inputs given, please check your data.", 422);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    const updatedPlace = {...DUMMY_PLACES.find(p => p.id === placeId)};
    const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);

    updatedPlace.title = title;
    updatedPlace.description = description;

    DUMMY_PLACES[placeIndex] = updatedPlace;

    res.status(200).json({place: updatedPlace});
};

const deletePlace = (req, res, next) => {
    const placeId = req.params.pid;
    if (!DUMMY_PLACES.find(p => p.id === placeId)) {
        throw new HttpError("Could not find a place for that id", 404);
    }

    DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
    res.status(200).json({message: "Deleted place"});
};


exports.getPlaceById = getPlaceById; // express will execute it when a request comes in
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
