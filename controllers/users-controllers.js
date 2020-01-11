const uuid = require("uuid/v4");
const {validationResult} = require("express-validator");

const HttpError = require("../models/http-errors");

const DUMMY_USERS = [
    {
        id: "u1",
        name: "Ivan Ivan",
        email: "test@test.com",
        password: "testers"
    }
];

const getUsers = (req, res, next) => {
    res.status(200).json({users: DUMMY_USERS});
};

const signup = (req, res, next) => {
    const errors = validationResult(req); // this will check the validators written in places-routes
    if (!errors.isEmpty()) {
        throw new HttpError("Invalid inputs given, please check your data.", 422);
    }

    const { name, email, password } = req.body;

    const hasUser = DUMMY_USERS.find(u => u.email === email);
    if (hasUser) {
        throw new HttpError("Could not create user. Email already exists", 422); // invalid user input
    }

    const createdUser = {
        id: uuid(),
        name,
        email,
        password
    };

    DUMMY_USERS.push(createdUser);

    res.status(201).json({user: createdUser});
};

const login = (req, res, next) => {
    const { email, password } = req.body;

    const identifiedUser = DUMMY_USERS.find(u => u.email === email)
    if (!identifiedUser || identifiedUser.password !== password) {
        throw new HttpError("Could not identify user, credentials seem to be wrong", 401); // auth error
    }
    res.json({message: "Logged in!"});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;