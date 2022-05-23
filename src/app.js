require('dotenv').config(); // it should be at the top, ye .env file ke liye hai 
const express = require('express');
const path = require('path');
const hbs = require('hbs'); // partial folder ki file ko run karvane ke liye hbs ko require karva rhe hai
const bcrypt = require("bcryptjs/dist/bcrypt");
const cookieParser = require("cookie-parser");



require("./db/connection");
const Register = require("./models/registers");
const auth = require("./middleware/auth");
const async = require('hbs/lib/async');

const app = express();
const port = process.env.PORT || 3000;

// These two lines for get data from input field 
app.use(express.json());
app.use(express.urlencoded({extended:false})); // Form ke andar jo bhi likha hai usse get karne ke liye ham iss line ka use karenge 
// ye line na likhne par hame console me undefined mil rha tha 
app.use(cookieParser());  // hame hamare node,express,mongoDB application ko ye btana hai ki mujhe cookie-parser ko as a middleware use karna hai 


const static_path = path.join(__dirname,"../public");
// console.log(static_path);  // E:\Registration from\public
const templates_path = path.join(__dirname,"../templates/views");
const partials_path = path.join(__dirname,"../templates/partials"); // partial folder ki file ko run karvane ke liye

app.use(express.static(static_path)); // express.static ye check kar rha hai ki index.html file hai ya nhi agar hai to vo page hame browser screen par dikhta 
app.set("view engine", "hbs"); 
app.set("views",templates_path);
hbs.registerPartials(partials_path); // partial folder ki file ko run karvane ke liye 

// console.log(process.env.SECRET_KEY);  // mynameishansrajsinghtomar

app.get("/", (req,res) => {
    // res.send("hansraj singh tomar with s yadav"); // index.html namilne par ye line show karegi screen par //! but ham partial file ko show karenge 
    res.render("index"); // yha ham index.hbs file ko show karva rhe hai 
})

app.get("/secret", auth, (req,res) => {
    // console.log(`This is the cookie - ${req.cookies.hansraj}`); // This is the cookie - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjgwYTI4MzhlZmU2MjJmNGY5ODUwZDQiLCJpYXQiOjE2NTI5NzI1NTYsImV4cCI6MTY1Mjk3MjU1OH0.kwLHZ4RXf0JjsRb0DDb9q05bGiNoNo3lYs0n9KDSspE 
    // This is the cookie - undefined, undefined isliye aa rha hai kyonki ham cookie genrate karvane ke sath hi cookie ko vaerify/request bhi karva rhe hai jo ki galat hai    
    // to ab hame request tabhi karna hai jab user login ya register kar leta hai uske baad jab ham uss token ko generate karva kar store karva rhe hai
    // next time jab user perticular pages ko open karvana chahega jo ki sirf authenticate user hai jinke pass apna kud ka token hai unke liye hi hoga vo tab hame usko verify karna hai ya uss cookie ko get karna hai 
    res.render("secret");
})

//! mere login karne par mujhe navbar me logout ka option dikhna chahiye - uske liye ham js ka code ya css ke through code likhenge jo alag chij hai 
app.get("/logout", auth, async (req,res) => {
    try {

        console.log(req.user);
        
        // ab mujhe data base se bhi cookie ko hatana hai to me filter method ka use karunga
        // for single logout
        // req.user.tokens = req.user.tokens.filter( (currElement) => {
        //     return currElement.token !== req.token;
        // }) 

        
        // logout from all devices
        req.user.tokens = [];


        res.clearCookie("hansraj"); // isse database me token delete nhi hoga uske liye ham filter method ka use kar ke code likhenge 
        console.log("Logout successfully");
        
        await req.user.save(); 
        res.render("login");
    
    } catch (error) {
    
        res.status(500).send(error);
    
    }
})

app.get('/register', (req,res) => {
    res.render("register");
})

app.get('/login', (req,res) => {
    res.render("login");
})


// create a new User in our database
app.post('/register', async (req,res) => {
    try {
        // console.log(req.body.firstname); // PostMan ke through ham req.body ka use karte the 
        // res.send(req.body.firstname);

        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        if(password === cpassword){
            
            const registerEmployee = new Register({
                
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                age: req.body.age, 
                password: req.body.password, // password : password ye bhi likh sakte hai koyki hamne pehle isse define kar diya hai that's why
                confirmpassword: req.body.confirmpassword, // confirmpassword: confirmpassword
                
            });
            
            /* // ! Second way to create hash password
            const  hpassword = await bcrypt.hash(password, 10);
            registerEmployee.password = hpassword;
            const  hcpassword = await bcrypt.hash(cpassword, 10);
            registerEmployee.confirmpassword = hcpassword;
            */

            console.log("The success part" + registerEmployee);
           
            const token = await registerEmployee.generateAuthToken();
            console.log("The token part" + " " +token);

            /*
                The res.cookie() function is used to set the cookies name to value.
                The value parameter may be a string or object converted to JSON.
                styntax :- res.cookie(name, value =, [options]) 

                HttpOnly is a flag that can be included in a set-Cookie response header.
                The presence of this flag will tell browser to not allow client side script
                access to the cookie (if the browser supports it)
            */

            res.cookie('hansraj', token, {
              expires:new Date(Date.now() + 60000),
              httpOnly:true,   // ab hamara jo client side scripting language hai vo hamare iss cookies ka jo value hai isko kuch bhi nhi kar sakta hai  
            //   secure:true, // it means ye jo cookies hai vo sirf https, secure connection par hi work karega 
            });
            console.log(cookie);

            const registered = await registerEmployee.save();
            // console.log("the page part" + " " + registered);

            res.status(201).render("index");
 
        }else{
            res.send("Invalid Details please enter valid details"); // it's just for showing, ye error message kabhi bhi nhi likhna hai ki password not matching.
        }
    } catch (error) {
        res.status(400).send(error);
        console.log("the error part page");
    }
});




// Login Check
app.post("/login", async (req,res) => {

    try {

        const email = req.body.email;
        const password = req.body.password;
        // console.log(`${email} and password is ${password}`);

        const user = await Register.findOne({email:email});
        // res.send(user.password);
        // console.log(user);
        // console.log(user.password); // isme hamara hash password hai 

        const isMatch = await bcrypt.compare(password, user.password);

        const token = await user.generateAuthToken();
        console.log("The token part" + " " +token);

        res.cookie('hansraj', token, {
            expires:new Date(Date.now() + 15000),
            httpOnly:true,   // ab hamara jo client side scripting language hai vo hamare iss cookies ka jo value hai isko kuch bhi nhi kar sakta hai  
            // secure:true,
        });


        // if(useremail.password === password){
        //! after using hashing  
        if(isMatch){
            res.status(201).render("index");
        }else{
            res.send("Invalid details please enter valid details")
        }

    } catch (error) {
       res.status(400).send(error); 
    }
})


app.listen(port, () => {
    console.log(`server is Listening at the port ${port}`);
})

//TODO: ----------------------------------------------------------//------------------------------------------------------- 

//! partial file ko run karvane ke liye ek extension add karvani hai package.json file me - "dev" : "nodemon src/app.js -e js,hbs" cmd ko ek bar close kar ke fir se chalana hai then it will work properly.


//! Hashing to secure password

// const bcrypt = require("bcryptjs");

// const securePassword = async (password) => {
//     const hashPassword = await bcrypt.hash(password, 10);  // second parameter me ya to ham string likh sakte hai ya number pass kar saskte hai 
//     console.log(hashPassword);  // $2a$10$cu7hXNxkfVYZZfz6dfm/7uF/2Fb/t0k5I3y3getnWsFbxOrjSKsZ6

//     const passwordMatch = await bcrypt.compare(password,hashPassword);
//     console.log(passwordMatch);
// }

// securePassword("hansraj123");

//! How to use Json web token 

// const jwt = require('jsonwebtoken');
// const createToken = async () => {
//     //! jwt.sign() se ham token genrate karvate hai 
//     const token = await jwt.sign({_id:"6280a2838efe622f4f9850d4"}, "mynameishansrajsinghtomar", { expiresIn : "2 seconds"});
//     console.log(token);  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjgwYTI4MzhlZmU2MjJmNGY5ODUwZDQiLCJpYXQiOjE2NTI5NzI1NTYsImV4cCI6MTY1Mjk3MjU1OH0.kwLHZ4RXf0JjsRb0DDb9q05bGiNoNo3lYs0n9KDSspE
    
//     //! jwt.verify() se ham user ko verify karvate hai 
//     const userVerification = await jwt.verify(token, "mynameishansrajsinghtomar");
//     console.log(userVerification);  // { _id: '6280a2838efe622f4f9850d4', iat: 1652972556, exp: 1652972558 }
// }
// createToken();


//! .env files some rules 

// It's a simple plane text file

/* 
By convention, the variables are written in uppercasse letters (e.g. PORT).
common examples of configuration data that are stored in environment variables include: HTTP port
database connection string
location of static files
endpoints of external services

The .env parsing rules
here are some basic parsing engine rules:

BASIC = basic becomes {BASIC: "basic"}
empty lines are skipped
comments strat with #
empty values become empty strings; BASIC = becomes {BASIC:''}
inner quotes are maintained 
existing environment variables are not modified; they are skipped.
*/


//! storing JWT Token in cookies
 // console.log(`This is the cookie - ${req.cookies.hansraj}`); // This is the cookie - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjgwYTI4MzhlZmU2MjJmNGY5ODUwZDQiLCJpYXQiOjE2NTI5NzI1NTYsImV4cCI6MTY1Mjk3MjU1OH0.kwLHZ4RXf0JjsRb0DDb9q05bGiNoNo3lYs0n9KDSspE 
    // This is the cookie - undefined, undefined isliye aa rha hai kyonki ham cookie genrate karvane ke sath hi cookie ko vaerify/request bhi karva rhe hai jo ki galat hai    
    // to ab hame request tabhi karna hai jab user login ya register kar leta hai uske baad jab ham uss token ko generate karva kar store karva rhe hai
    // next time jab user perticular pages ko open karvana chahega jo ki sirf authenticate user hai jinke pass apna kud ka token hai unke liye hi hoga vo tab hame usko verify karna hai ya uss cookie ko get karna hai 

    /*
            The res.cookie() function is used to set the cookies name to value.
            The value parameter may be a string or object converted to JSON.
            styntax :- res.cookie(name, value =, [options]) 

            HttpOnly is a flag that can be included in a set-Cookie response header.
            The presence of this flag will tell browser to not allow client side script
            access to the cookie (if the browser supports it)
    */
            // res.cookie('hansraj', token, {
            //     expires:new Date(Date.now() + 60000),
            //     httpOnly:true,   // ab hamara jo client side scripting language hai vo hamare iss cookies ka jo value hai isko kuch bhi nhi kar sakta hai  
            //      secure:true, // it means ye jo cookies hai vo sirf https, secure connection par hi work karega 
            //   });
            //   console.log(cookie);