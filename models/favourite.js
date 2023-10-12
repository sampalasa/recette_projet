const  mongoose= require("mongoose");
const passportlocalMongoose=require("passport-local-mongoose");

// require passport qui mieux faire lac onnexion
const FavouriteSchema =new mongoose.Schema({
    Image: String,
    title:String,
    description:String,
    user:String,
    date:{
        type:Date,
        default: Date.now()
    }
});


module.exports =mongoose.model("Favourite",FavouriteSchema);