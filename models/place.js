const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const placeSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },  // this is a url pointing to a file
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    creator: { type: mongoose.ObjectId, required: true, ref: "User" } // the ref establishes a connection between place and user.
                                                                        // the creator id will come from the user id
});

module.exports = mongoose.model("Place", placeSchema); // uppercase. no plural!
