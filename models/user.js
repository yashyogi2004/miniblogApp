const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/project1');

const userSchema=mongoose.Schema({
   username: String,
    name: String,
   email: String,
   age:Number,
   password: String,
   age: String,
   posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }]
});
module.exports=mongoose.model('user',userSchema);