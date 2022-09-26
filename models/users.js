const {model, Schema} = require("mongoose");

const UserSchema = new Schema({
    name:{
        type:String,
    },
    fullName:{
        type:String,
        default:""
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String,
    },
    phoneNumber:[
   {
    countryCode:Number,
    telNumber:Number
   }
    ]
},{
    timestamps: true,
})

module.exports = model("User", UserSchema)