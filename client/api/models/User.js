
//defining a user model 
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//setting us passport with local strategy for authenication
const UserSchema = new mongoose.Schema({
    username: String,
    email: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);

