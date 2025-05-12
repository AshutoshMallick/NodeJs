const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

//setting up the admin schema
const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    tokens: [
        {
            token: {
                type: String
            }
        }
    ]
});
adminSchema.methods.generateAuthToken = async function () {
    const admin = this;
    const token = jwt.sign({ _id: admin._id.toString() }, "xeEo2M0ol8CeWr7Nw2g2GjH8QEUK4dyyKCHi4TYJK6znm5fuAHIIPHSQ5YvdVcLlnaxppN64xK6xbhRileWvIlzCEqrBMCiITD8z");
    admin.tokens = admin.tokens.concat({ token });
    await admin.save();
    return token;
};

//setting up the model
const Admin = mongoose.model("Admin", adminSchema);

//exporting admin model
module.exports = Admin;