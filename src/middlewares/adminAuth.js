const jwt = require("jsonwebtoken");
const Admin = require("../mongoose/models/admin");

const adminAuth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, "xeEo2M0ol8CeWr7Nw2g2GjH8QEUK4dyyKCHi4TYJK6znm5fuAHIIPHSQ5YvdVcLlnaxppN64xK6xbhRileWvIlzCEqrBMCiITD8z");
        const admin = await Admin.findOne({ _id: decoded._id, "tokens.token": token });

        if (!admin) {
            throw new Error();
        }

        req.admin = admin;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: "Please authenticate as admin" });
    }
};

module.exports = adminAuth;
