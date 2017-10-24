const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
mongoose.Promise = global.Promise;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            isAsync: true,
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

// Return data to JSON and show id and email only afrter data save
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

// Generete jwt token
UserSchema.methods.generateAuthToken = function() {
    const user = this;
    const access = 'auth';
    const token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens.push({ access,token });
    
    return user.save().then(() => {
        return token;
    });

};

// Custom function mongoose for find user token
UserSchema.statics.findByToken = function (token) {
    const User = this;
    let decoded;
    
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (e) {
        // return new Promise((resolve, reject) => {
        //     reject();
        // });
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}

// Custome function mongoose static for find user token and give credentials
UserSchema.statics.findByCredentials = function (email, password) {
    const User = this;

    return User.findOne({email}).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        // return new Promise((resolve, reject) => {
        //     // Compare bcrypt
        //     bcrypt.compare(password, user.password, (err, res) => {
        //         if (res) {
        //             return resolve(user);
        //         } else {
        //             reject();
        //         }
        //     });
        // });

        return bcrypt.compare(password, user.password).then((res) => {
            if (res) {
                return Promise.resolve(user);
            // } else {
            //     return Promise.reject();
            }
        })
        .catch((e) => {
            return Promise.reject(e)
        });
    });
};

// Custome function mongoose methods for find user token and give credentials
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.methods.removeToken = function (token) {
    var user = this;

    return user.update({
        // $pull to remove item from array with match criteria
        $pull: {
            tokens: {
                token: token
            }
        }
    });
};

// mongoose middleware to check password has hash before data save
UserSchema.pre('save', function (next) {
    const user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) {
                    console.log(err)
                }
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};