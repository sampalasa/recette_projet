const express=require("express")
const app=express();

const bodyParser=require("body-parser");
const ejs=require("ejs")
const mongoose=require("mongoose");
const bcrypt =require("bcrypt");
const randToken=require("rand-token");
const nodemailler=require("nodemailer");

const session=require("express-session");
const passport=require("passport");
const passportlocalMongoose=require("passport-local-mongoose");
// Models require
const User =require("./models/user");
const Reset =require("./models/reset");
const Receipe =require("./models/receipe");
const Ingredient =require("./models/ingredient");
const Favourite =require("./models/favourite");
const Schedule =require("./models/schedule");

app.use(session({
 secret:'mysecret',
 resave:false,
 saveUninitialized:false
// c code nous dit que si on a des session qui n'ont jamais etais unitialiser
//on le enregistré si pas le contraire
}));
app.use(passport.initialize());//initialisation de passport
app.use(passport.session());// ilva gerer nos session

/*mongoose.connect('mongodb://127.0.0.1:27017/DB_recette',{
    useNewUrlParser: true,
    useUnifiedTopology: true

}).then(db =>{

    console.log('connnexion MONGO reussi');

}).catch(error=> console.log(error));
*/

mongoose.connect("mongodb+srv://palasa:sarrive@cluster0.zrsfhjt.mongodb.net/OS?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

//mongoose.set('useFindAndModify', false);
// en dessou de mongoose c pour que passport reconnaisse nos requette
//PASSPORT LOCAL MONGOOSE
passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//EJS ,unitialiser ejs
app.set("view engine","ejs");
//unitialiser notre dossier public
app.use(express.static("public"));

// exyention bodyparse
app.use(bodyParser.urlencoded({extended:false}));


//
const methodOverride=require("method-override");
const flash=require("connect-flash");//permet d'envoyer des messages
const favourite = require("./models/favourite");
const schedule = require("./models/schedule");
app.use(flash());// etape de messages unitialisation de flash
//on doit unitialiser notre methoe methidOverride qui nous perùetre de supprimer
app.use(methodOverride('_method'));
app.use(function(req, res, next){
    res.locals.currentUser = req.user;//tout les informations de l'utilisateur
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//envoi de la page principale de notre site
app.get("/",function(req,res){
    res.render("index");
});
// creation de nptre route signup et login
app.get("/signup",(req,res)=>{
res.render("signup")

});
app.post("/signup",(req,res)=>{
    // creation d'une nouvelle collection
const newUser =new User({
    username:req.body.username
});
//pour enregistrer l'utilisateur dans la base de donnée avc la methode register
User.register(newUser,req.body.password,function(err,user){
if(err){
    console.log(err);
    res.render("signup");
}else{

    passport.authenticate("local")(req,res,()=>{
        res.redirect("/dashboard");
    });
}

});

    // masque le mot de pass avc bcrytp en utilsant hash
   /* const saltRounds = 10;
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        const user ={
            username:req.body.username,
            password:hash
        }
        User.create(user,function(err){
        if(err){
        
            console.log(err);
        }else{
            res.render("index");
        }
        
        });
        // enregisterr dans notre basse de donnée
       // on copie le mot de pas qui a ete recuperpe dans post pour le crypter avc Bcrypt
        });
    });
// reuperrer l'informattion saisie



app.get("/login",(req,res)=>{

    res.render("login");*/

});
app.get("/login",(req,res)=>{

    res.render("login")

});

app.post("/login",function(req,res){
//passport pour recuperer le user
const user = new User({
    username:req.body.username,
    password:req.body.password
});
req.login(user,(err)=>{
    if(err){
        console.log(err);
    }else{
          passport.authenticate("local")(req,res,()=>{
           
            //on sert flash pour verifier les err
           // req.flash("sucess","congratulation , you are logged in !!") on pouvez l'utiliser dans login mais c pas interrsant
            res.redirect("/dashboard",)
          });
    }
});

});

app.get("/dashboard",isloggedIn,function(req,res){
    // apres la creation de la focntion de connction ,maintena on doi l'appel dans notre dashboar islogg
   console.log(req.user)
    res.render("dashboard");
});

// Destroys the session to log out the user.
//docn je vais deconnecter notre unitisateur pour fermer sa session3
app.get("/logout", (req, res) => {
    req.logout(req.user, err => {
      if(err) return next(err);

     req.flash('success', 'You have successfully logged out');
     
      res.redirect('/login');
  
    
    });
   
  });
  // creation de token dans la page forgot pour changer le mot de pass
  app.get("/forgot",function(req,res){

    res.render("forgot");
  });
  app.post("/forgot",function(req,res){
User.findOne({username:req.body.username},function(err,userfound){
    if(err){
        console.log(err)
        res.redirect("/login");
    }else{
        //creation de token aleatoire
        const token= randToken.generate(16);
        //cree un nouveau document
      Reset.create({
        username:userfound.username,
        resetPasswordToken:token,
        resetPasswordExpires:Date.now() + 3600000
      });
      // on doit cree un email avc nodemailler
      // pour nous envoyer un Email
      const transporter=nodemailler.createTransport({
        service:'gmail',
        host: 'smtp.gmail.com',
        port: 3000,
        secure: true,
        //info de celui qui envoi le mail
        auth: {
            user:'vonmoov@gmail.com',
            pass:'kvgmmozbkgslvphv'
        }
      });
      const mailOption={
        from:'vonmoov@gmail.com',
        to:req.body.username,
        subject:'link to reset you password',
        text:'click on this link to reset you password:http://localhost:3000/reset/'+token
      }
      console.log("le email est pret a etre envoyer");

      transporter.sendMail(mailOption,(err,response)=>{
        if(err){

            console.log(err);
        }else{
            res.redirect("/login");
        }
      })
    }
});

  });
  //dron cree notre route qui contiendran le token
  app.get("/reset/:token",(req,res)=>{
// on verrifier si le token est toujour valide
Reset.findOne({
    resetPasswordToken:req.params.token,
    resetPasswordExpires:{$gt:Date.now()}
},function(err,obj){
    if(err){
        console.log("le token expires");
        res.redirect("/login");
    }else{
 // recureper le token dans la page reset
  res.render("reset",{token:req.params.token});
    }
});
  });
  //c code va rediriger l'utilisateur vaers le resertset
  app.post("/reset/:token",(req,res)=>{
//recuperrer le mot de passe du client pour le modifier et verifier que le token est toujour valide et s'il existe et de verifie si les password est  ein ego
Reset.findOne({
    resetPasswordToken:req.params.token,
    resetPasswordExpires:{$gt:Date.now()}
},function(err,obj){
    if(err){
        console.log("le token expires");
        res.redirect("/login");
    }else{
        //si le pass word son ego on peut le modufier
        if(req.body.password==req.body.password2){
            //si le client existe vraiment
            User.findOne({username:obj.username},function(err,user){
                if(err){
                    console.log(err)
                }else{
                 //modifier et changer le mot de pass ou actualiser
                 user.setPassword(req.body.password,function(err){
                    if(err){
                        console.log(err)
                    }else{
                        // sauvé notre nouvelle utilisateur
                        user.save();
                        //actuliser le token pour le mettre a nul
                        const updatedReset={
                            resetPasswordToken:null,
                            resetPasswordExpires:null
                        }
                        //actualiser la teble reset pour finir
                        Reset.findOneAndUpdate({resetPasswordToken:req.params.token},updatedReset,function(err,obj1){

                            if(err){
                               console.log(err); 
                            }else{
                                
                                res.redirect("/login");
                            }
                        });
                    }

                 });
                }
            });
        }
    }
  });
});

//RECEIPE ROUTE
app.get("/dashboard/myreceipes",isloggedIn,function(req,res){
    Receipe.find({
        user:req.user.id
    },function(err,receipe){
        if(err){
            console.log(err);
        }else{
            res.render("receipe",{receipe:receipe});
        }
    });
   
});
// on crre notre route de nouvel recette
app.get("/dashboard/newreceipe",isloggedIn,function(req,res){
    res.render("newreceipe");
});
//on ajouter user automatiquement
app.post("/dashboard/newreceipe",function(req,res){
   const newReceipe={ name:req.body.receipe,
    image:req.body.logo,
    user:req.user['id']
} 
    Receipe.create(newReceipe,function(err,newReceipe){
        if(err){
            console.log(err);
        }else{
            req.flash("success","new receipe added!");
            res.redirect("/dashboard/myreceipes")
        }
    });
});
// app.js pour cree notre nouvelle route
app.get("/dashboard/myreceipes/:id",function(req,res){
    Receipe.findOne({
        user:req.user['id'],_id:req.params['id']
        //on verifie deux chose d'une pars c l'utilisateur et d'autre pars on verifie c bien l'url de l(id de notre rescette)

    },function(err,receipeFound){
        if(err){
            console.log(err);
        }else{
            Ingredient.find({
                user:req.user["id"],
                receipe:req.params['id']

            },function(err,ingredientFound){

                if(err){
                    console.lof(err);
                }else{
          res.render("ingredients",{
            ingredient: ingredientFound,
            receipe:receipeFound
          });
                }
            });
        }
    });
});
app.delete("/dashboard/myreceipes/:id",isloggedIn,function(req,res){
Receipe.deleteOne({_id:req.params['id']},function(err){
    if(err){
        console.log(err)
    }else{
        req.flash("success","the receipe has been deleted!");
        res.redirect("/dashboard/myreceipes")
    }
});
});

//ingredient route tout ec qui touche les ingredient  (INGREDIENT ROUTE)
app.get("/dashboard/myreceipes/:id/newingredient",function(req,res){
    Receipe.findById({_id:req.params['id']},function(err,Found){
        if(err){
            console.log(err);
        }else{
            res.render("newingredient",{receipe:Found});
        }
    });
});
//RECETTE FAVORIS
app.get("/dashboard/favourites",isloggedIn,function(req,res){
    Favourite.find({user:req.user['id']},function(err,favourite){
        if(err){
            console.log(err)
        }else{
            res.render("favourites",{favourite:favourite});
        }
    });
   
});
// on recupere les infomations on le cree et on  le redirige
app.get("/dashboard/favourites/newfavourite",function(req,res){
res.render("newfavourite");
});
app.post("/dashboard/favourites",function(req,res){
    const newFavourite={
    Image: req.body.image,
    title:req.body.title,
    description:req.body.description,
    user:req.user['id']
    }
    Favourite.create(newFavourite,function(err,newFavourite){
if(err){
    console.log(err);
}else{
    req.flash("success","you just added a new fav!");
res.redirect("/dashboard/favourites");
} 
    });
});


app.delete("/dashboard/favourites/:id",function(req,res){
    Favourite.deleteOne({_id:req.params['id']},function(err){
        if(err){
            console.log(err)
        }else{
            req.flash("success","you for has been deleted");
            res.redirect("/dashboard/favourites");
        }
    });
});





app.post("/dashboard/myreceipes/:id",function(req,res){
    const newIngredient={
        name:req.body.name,
        bestDish:req.body.dish,
        user:req.user['id'],
        quantity:req.body.quantity,
        receipe:req.params['id']
    }
    //inserssion dans la table
    Ingredient.create(newIngredient,function(err,newIngredient){
        if(err){
            console.log(err)
        }else{
            req.flash("success","you ingredient has been added! ")
            res.redirect("/dashboard/myreceipes/"+req.params['id']);
        }
    });
});
app.delete("/dashboard/myreceipes/:id/:ingredientid",isloggedIn,function(req,res){
    Ingredient.deleteOne({_id:req.params.ingredientid},function(err){
        if(err){
            console.log(err);
        }else{
            req.flash("success","you ingredient has been delete");
            res.redirect("/dashboard/myreceipes/"+req.params['id']);
        }
    });
});
app.post("/dashboard/myreceipes/:id/:ingredientid/edit",isloggedIn,function(req,res){
    Receipe.findOne({user:req.user['id'],_id:req.params['id']},function(err,receipeFound){
        if(err){
            console.log(err);
        }else{
            Ingredient.findOne({
                _id:req.params.ingredientid,
                receipe:req.params['id']
            },function(err,ingredientFound){
                if(err){
                    console.log(err);
                }else{
                    res.render("edit",{
                        ingredient:ingredientFound,
                        receipe:receipeFound
                    });
                }
            });
        }
    });
});
app.put("/dashboard/myreceipes/:id/:ingredientid/",isloggedIn,function(req,res){
    const ingredient_updated={
    name:req.body.name,
    bestDish:req.body.dish,
    user:req.body['id'],
    quantity: req.body.quantity,
    receipe:req.params['id']
    }
    Ingredient.findByIdAndUpdate({_id:req.params.ingredientid},ingredient_updated,function(err,updatedIngredients){
        if(err){
            console.log(err)
        }else{
           req.flash("success","successfully updated your ingredient") ;
           res.redirect("/dashboard/myreceipes/"+req.params['id']);
        }
    });
});

// ROUTE SCHEDULE
app.get("/dashboard/schedule",isloggedIn,function(req,res){
    Schedule.find({user:req.user['id']},function(err,schedule){
       if(err){
           console.log(err)
       }else{
           res.render("schedule",{schedule:schedule});
       }
    });

});
app.get("/dashboard/schedule/newschedule",isloggedIn,function(req,res){
    res.render("newSchedule")
});
app.post("/dashboard/schedule",isloggedIn,function(req,res){
    const  newSchedule={
    Receipename:req.body.receipename,
    scheduleDate:req.body.schedulename,
    user:req.user['id'],
    time:req.body.time
    }
    schedule.create(newSchedule,function(err,newSchedule){
        if(err){
            console.log(err)
        }else{
            req.flash("success","you just added a new schedule");
            res.redirect("/dashboard/schedule");
        }
    });
});
app.delete("/dashboard/schedule/:id",isloggedIn,function(req,res){
    Schedule.deleteOne({_id:req.params['id']},function(err){
        if(err){
            console.log(err);
        }else{
            req.flash("success","you are successfuly deleted the shcedule");
            res.redirect("/dashboard/schedule");
        }
    })
})

//cette focntion permet de mettre une condition de l'utilisateur docn il a le droit d'y aller s'il est connecter ou pas
//fonction de connection
function isloggedIn(req,res,next){
    if(req.isAuthenticated()){
      return next();
    }else{
        req.flash('error','please login first');
        res.redirect("/login");
    }
}


/*
app.get("/logout",function(req,res){
 req.logout();
 res.redirect("/login");

})*/

    // on dot verifier si l'utilisateur existe , s'il a un compte
   /* User.findOne({username:req.body.username},function(err,foundUser){

        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                //on va comparer le mot de passe de l'utliseteur saisi
                bcrypt.compare(req.body.password,foundUser.password,function(err,result){
                    if(result==true){
                        console.log("super tu es connectez");
                        res.render("index");
                    }else{
                        console.log(" t'es pas connectez");
                        res.render("index");
                    }
                })
                /*if(foundUser.password==req.body.password){
                    res.render("index");
                }
            }else{
                res.send("<h1>erro tu n'existe pas </h1>!!");
              
            }

        }
    });*/



//npm install bcrypt permet de crypter notre mot de pass pour qu'il ne soit visible par un hacker







app.listen(5000,function(){

console.log("vous ets bien sur le port 5000");

});