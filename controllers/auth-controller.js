const User = require('../models/user.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// register controller
const registerUser = async(req, res) => {
  try {
    //extract user Info from req.body
    const {username, email, password, role} = req.body;

    //if the user already exists in our database
    const checkExistingUser = await User.findOne({$or : [{username}, {email}]});

    if(checkExistingUser){
      return res.status(400).json({
        success: false,
        message: 'User alredy exists Either with same UserName or same Email please Try with a different username or email.'
      });
    };

    //Create a new User
    const newlyCreateduser = new User({
      username,
      email,
      password,
      role: role || 'user'
    });

    //run validation on raw password
    await newlyCreateduser.validate();

    //Hash User password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Update to hashed password
    newlyCreateduser.password = hashedPassword;

    //Save the user
    await newlyCreateduser.save();

    res.status(201).json({
      success: true,
      message: 'User registered Successfully'
    });
  } catch (err) {
    console.error("Error occured", err);

    if(err.name === "ValidationError"){
      let errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'some error occured! Please try again'
    });
  }
}

// login controller
const loginUser = async(req, res) => {
  try {
    const {username, password} = req.body;

    // find if the Current user exits in DB or not
    const user = await User.findOne({username});

    if(!user){
      return res.status(400).json({
        success: false,
        message: 'Invalid Username or User doesn\'t exists',
      })
    }

    //If the password is correct
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if(!isPasswordMatch){
      return res.status(400).json({
        success: false,
        message: 'Invalid Credential',
      });
    }

    //create user token
    const accessToken = jwt.sign({
      userId: user._id,
      username: user.username,
      role: user.role
    }, process.env.JWT_SECRET_KEY, {
      expiresIn : '30m'
    });

    res.status(200).json({
      success: true,
      message: 'Logged In Successfully',
      accessToken
    })

  } catch (err) {
    console.error("Error occured", err);
    res.status(500).json({
      success: false,
      message: 'some error occured! Please try again'
    })
  }  
}

const changePassword = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    //extract old and new password
    const {oldpassword, newpassword} = req.body;

    //find the current user
    const user = await User.findById(userId);

    if(!user){
      return res.status(404).json({
        success: false,
        message: "user not found"
      });
    }

    //if the old Password is correct
    const isPasswordMatch = await bcrypt.compare(oldpassword, user.password);

    if(!isPasswordMatch){
      return res.status(400).json({
        success: false,
        message: "old password is not correct. please try again"
      });
    }

    //if old password and new password are same
    if(oldpassword === newpassword){
      return res.status(400).json({
        success: false,
        message: "old password and new password can't be same"
      });
    }

    //hash the new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newpassword, salt);

    //update user password
    user.password = newHashedPassword
    await user.save();

    return res.status(200).json({
      success: true,
      message: "password changed successfully."
    });

  } catch (e) {
    console.error("Error: ",e);
    res.status(500).json({
      success: false,
      message: "Some error occured! please try Again."
    });
  }
}

module.exports = {loginUser, registerUser, changePassword}