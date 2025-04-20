const express=require('express');
const app=express();
const userModel=require('./models/user');
const postModel=require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const user = require('./models/user');

app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());


app.get('/',(req,res)=>{
    res.render('login');
})
app.get('/register',(req,res)=>{
    res.render('index');

});

//regidter logic
app.post('/register',async(req,res)=>{
    let{email,password,username,name,age}=req.body;
    let user=await userModel.findOne({email:req.body.email});
    if(user){
      return res.send("user already exist");
    }
    else{
       bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,(err,hash)=>{
            let user=new userModel({
                email:email,
                password:hash,
                username:username,
                name:name,
                age:age
            });
            user.save();
            let token =jwt.sign({email:email,userid:user._id},"secret");
            res.cookie('token',token);
           res.redirect('/')
        })
       })
    }
});


//login logic
app.post('/login',async(req,res)=>{
    let {email,password}=req.body;
    let user=await userModel.findOne({email:email});
    if(!user) return res.status(500).send("something went wrong");
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            let token =jwt.sign({email:email,userid:user._id},"secret");
            res.cookie('token',token);
            res.status(200).redirect('/dashboard');
        }
    });
});

app.get('/logout',(req,res)=>{
    res.clearCookie('token');
    res.redirect('/');
})



function isLoggedIn(req,res,next){
if(req.cookies.token){
    jwt.verify(req.cookies.token,"secret",function(err,decoded){
        if(err){
            res.redirect('/');
        }
        else{
            req.user=decoded;
            next();
        }
    });
}
else{
    res.redirect('/');
}
}
//dashboard route
    app.get('/dashboard',isLoggedIn,async (req,res)=>{
       let user1=await userModel.findOne({email:req.user.email}).populate("posts");
       res.render('dashboard',{user:user1});
    })

    //like route
    app.get('/like/:id',isLoggedIn,async (req,res)=>{
        let post=await postModel.findById(req.params.id).populate("user");
      if(post.likes.includes(req.user.userid)){
        post.likes.splice(post.likes.indexOf(req.user.userid),1);       
      }else{
       post.likes.push(req.user.userid);
      }    
        await post.save();
        res.redirect('/dashboard');
     })

     //edit route
     app.get('/edit/:id',isLoggedIn,async (req,res)=>{
        let post=await postModel.findOne({_id:req.params.id}).populate("user");
        res.render('edit',{post});
     })
     
     //update post route
     app.post('/update/:id',isLoggedIn,async (req,res)=>{
        let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
        res.redirect('/dashboard');
        
     })



    app.post('/post',isLoggedIn,async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    let post= await postModel.create({
        user:user._id,
        content:req.body.content,
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect('/dashboard');

    });

app.listen(3000,()=>{
    console.log("server is running on port 3000");
})
