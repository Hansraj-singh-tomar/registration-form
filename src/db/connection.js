const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/youtubeRegistration", {
    useNewUrlParser:true,
    useUnifiedTopology:true,
    
}).then(()=>{
    console.log("connection successful");
}).catch((e)=>{
    console.log(e); // if i'll get some error it will show me exject error 
})