const uuid = require("uuid/v4");
const {validationResult} = require("express-validator");
const User = require("../models/user");

const HttpError = require("../models/http-errors");


const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, "-password"); // this will check and return the email and name. without the password. Alternative is 'name email'
    } catch (err) {
        const error = new HttpError("Fetching users failed. Try again.", 500);
        return next(error);
    }

    res.json({users: users.map(u => u.toObject({getters: true}))});  // find returns an array, thats why we use this method to get all to be objects
};

const signup = async (req, res, next) => { // throw does not work in async
    const errors = validationResult(req); // this will check the validators written in places-routes
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs given, please check your data.", 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({email: email}); // this method finds one document matching the criteria given in the method
    } catch (err) {
        const error = new HttpError("Signing up failed. Try again.", 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError("User exists already. Please login instead.", 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        image: "https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg",
        password,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError("Signing up failed. Try again", 500);
        return next(error); // this needs to be added so that the code execution stops when the error occurs
    }

    res.status(201).json({user: createdUser.toObject({getters: true})});
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({email: email}); // this method finds one document matching the criteria given in the method
    } catch (err) {
        const error = new HttpError("Logging in failed. Try again.", 500);
        return next(error);
    }

    if (!existingUser || existingUser.password !== password) {
        const error = new HttpError("Invalid inputs.", 401);
        return next(error);
    }

    res.json({message: "Logged in!"});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;