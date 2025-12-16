const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:[true,"username is required"],
            trim:true,
        },
        email:{
            type:String,
            required:[true,"email is required"],
            unique:true,
            lowercase:true,
            trim:true,
        },
        password:{
            type:String,
            required:[true,"password is required"],
            minlength:6,
            select:false,
        },
        role:{
            type:String,
            enum:['user','admin'],
            default:'user',
        },
    },
    {timestamps:true}
);

//hash password before saving in db..
userSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//comparing the password during user try to login..
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password);
}

const User = mongoose.model("User",userSchema);

module.exports = User