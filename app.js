const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const url = "mongodb+srv://divakaivan:nUJ8IvonHGZMbosB@cluster0-cniio.mongodb.net/places?retryWrites=true&w=majority";

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-errors");

const app = express();
// ORDER MATTERS!
app.use(bodyParser.json());

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
     // error handling for unsupported routes.
    throw new HttpError("Could not find this route", 404);
}); // this middleware will be reached only if we did not get a response from the above ones

app.use((error, req, res, next) => { // error handling middleware
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || "An unknown error occurred!"});
});


mongoose
    .connect(url)
    .then(() => {
        app.listen(5000);
        console.log("Connected to database SUCCESSFUL")
    })
    .catch(err => {
        console.log(err);
    });
