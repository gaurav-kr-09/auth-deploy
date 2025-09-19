const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique : true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique : true,
    trim: true,
    lowercase : true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required : true,
    trim: true,
    minlength: [8, 'Password should have minimum 8 characters'],
    validate: {
      validator: function (value) {
        return (
          /[a-z]/.test(value) && 
          /[A-Z]/.test(value) &&
          /\d/.test(value) &&
          /[\W_]/.test(value)
        );
      },
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  },
  role: {
    type: String,
    enum : ['user', 'admin'],
    default: 'user'
  }
},
{timestamps: true});

module.exports = mongoose.model('User', UserSchema);