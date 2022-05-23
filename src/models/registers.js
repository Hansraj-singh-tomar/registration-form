const bcrypt = require("bcryptjs/dist/bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const res = require("express/lib/response");

const employeeSchema = new mongoose.Schema({
    firstname: {
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    gender:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true,
        unique:true
    },
    age:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true,
        unique:true
    },
    confirmpassword:{
        type:String,
        required:true,
        unique: true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});

//! Generating tokens
employeeSchema.methods.generateAuthToken = async function(){  // yha ham method ko isliye call kar rhe hai knoki yha ham instance ke sath kam kar rhe hai
// app.js file me registerEmployee mere collection(Register) ka instance hai, isliye ham method ka use karenge agar ham direct collection ke sath work kar rhe hote to ham static() ka use karte instead of method     
    try {
        console.log(this._id);
        // const generatedToken = jwt.sign({_id:this._id.toString()}, "mynameishansrajsinghtomar");
        const generatedToken = jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:generatedToken});
        await this.save(); // ye token ko database me store kar rha hai 
        console.log(generatedToken);
        return generatedToken;
    } catch (error) {
        res.send("The error part" + " " +error);
        console.log("the error part" + " " +error);
    }
}



// converting password into hash
//! data ko get karne ke baad or ye save method ko call karne se pehle mujhe bich me apne password ko hash karna padega 
//! taki normal text hash ho jaye and then save method call ho jaye, 
//! issi ko concept of middleware bolte hai 

employeeSchema.pre("save", async function(next) {  //! employeeSchema.post method bhi hoti hai
    // const passwordHash = await bcrypt.hash(password, 10); //! 10 means kitne round chalvane hai password me 
    
    if(this.isModified("password")){ //! jab user sirf password update ya new registration kr rha hai tabhi hame hash password ko generate karna hai, updation ke time sirf hame name and age vagerah change karna hai tab ham hash password nhi generate karenge 
        // console.log(`The current password is ${this.password}`);  // The  current password is 12345
        this.password = await bcrypt.hash(this.password,10);
        // console.log(`The current password is ${this.password}`);  // The  current password is $2a$10$vU0vF0h9OVjtL3CF42dnTOWBjUy4ACDkfrsHi6TyJfzUlCqyOOaFC
        // this.confirmpassword = undefined; // confirmpassword ki field hi delete ho jayegi DataBase me 
        this.confirmpassword = await bcrypt.hash(this.password,10);
        // hame to confirmpassword sirf check karvana tha ki user ko apna password yaad hai ya nhi  baki isse hame databse me add nhi karvana tha. 
    }
    next();
});


//! Now we need to create a collections 
const Register = new mongoose.model("Register",employeeSchema);

module.exports = Register;


//! Differences 
/* 
static are the methods defined on the model.
methods are defined on the document(instance).

Use.statics
for static methods.

Use.methods
for instance methods
*/

