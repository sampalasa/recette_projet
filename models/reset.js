const mongoose=require("mongoose");
const passportlocalMongoose=require("passport-local-mongoose");

const resetSchema=new mongoose.Schema({
    username:String,
    resetPasswordToken:String,
    resetPasswordExpires:Number
});
// hasher notre token puour la securité
resetSchema.plugin(passportlocalMongoose);
module.exports=mongoose.model("Reset",resetSchema);




//la page de token 