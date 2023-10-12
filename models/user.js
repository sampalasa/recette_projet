const  mongoose= require("mongoose");
const passportlocalMongoose=require("passport-local-mongoose");

// require passport qui mieux faire lac onnexion
const userSchema =new mongoose.Schema({
     username:String,
     password:String
});
userSchema.plugin(passportlocalMongoose);//cre de mot de pass dans notre base de donnée

module.exports =mongoose.model("User",userSchema);