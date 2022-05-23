const async = require('hbs/lib/async');
const jwt = require('jsonwebtoken');
const Register = require("../models/registers");
require('dotenv').config();


const auth = async (req,res,next) => {
    try {

        const token = req.cookies.hansraj;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY)
        console.log(verifyUser);  // { _id: '628870421614d7104bf770ae', iat: 1653153483 }  jitni bar login karunga utne ye object create hote jayenge
        
        const user = await Register.findOne({_id:verifyUser._id});
        console.log(user);
        // console.log(user.firstname);

        req.token = token;  
        req.user = user;   //! req.token and req.user ka use ham app.js file me karenge taki database se connect kar paye
        next();

    } catch (error) {

        res.status(401).send("error from auth.js file" + " " + error);

    }
}

module.exports = auth;


/*
    cookies are small files which are stored on a user's computer. 
    They are designed to hold a modest amount of data specific to a 
    particular client and website, and can be accessed either by the web server or the client computer.
*/