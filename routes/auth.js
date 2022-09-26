const router = require("express").Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { randomBytes } = require("crypto");

// Register

router.post("/signUp", async (req, res) => {
  const { name, email, password, fullName, countryCode, telNumber } =
    req.body;

  if (
    !name ||
    !email ||
    !password ||
    !fullName ||
    !telNumber ||
    !countryCode
  ) {
    return res
      .status(404)
      .json({ msg: "Please some line was not filled try again" });
  }

  const numType = typeof(telNumber)
  const countryType = typeof(countryCode)

  if(numType !== Number || countryType !== Number){
    return res.status(407).json({msg:"Sorry, don't mix letters or symbols in your phone number"})
  }

  // regex for email
  if (
    !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  ) {
    return res.status(422).json({
      error:
        "Sorry, you entered your email incorrectly, please enter your email carefully!",
    });
  }
  // regex for password
  if (!/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{4,}$/.test(password)) {
    return res.status(422).json({
      error:
        "Sorry, your password must be at least 4 characters long, at least 1 uppercase and lowercase letter and 1 number!",
    });
  }

  try {
    const findUser = await User.findOne({ email: email });
    if (findUser) {
      return res
        .status(401)
        .json({ msg: "Sorry, this email has already been registered" });
    }
    let hashPass = await bcrypt.hashSync(password, 10);

    const newUsers = new User({
      name,
      email,
      password: hashPass,
    });
    const user = await newUsers.save();
    if (!user) {
      return res
        .status(409)
        .json("Sorry, there was an error during registration");
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          fullName: fullName,
        },
        $push: {
          phoneNumber: {
            countryCode,
            telNumber,
          },
        },
      },
      { upsert: true }
    );

    return res.status(200).json({msg:"You have successfully registered"});
  } catch (error) {
    console.log(error);
  }
});

// Login

router.post("/signIn", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(404)
      .json({ msg: "Please some line was not filled try again" });
  }

  try {
    const findUser = await User.findOne({ email: email });

    if (!findUser) {
      return res
        .status(403)
        .json({ msg: "Sorry, no one has registered with this email" });
    }

    const compaerPassUser = await bcrypt.compare(password, findUser.password);
    if (!compaerPassUser) {
      res
        .status(403)
        .json({ msg: "Sorry, your password is wrong, please try again" });
    }
    const { password: pass, ...info } = findUser._doc;
    const token = jwt.sign(
      { _id: info._id, isAdmin: info.isAdmin },
      process.env.JWT_SECRET
    );
    console.log(findUser._doc)
    return res.status(200).json({ user: { ...info }, token });
  } catch (error) {
    return console.log(error);
  }
});

// forget password
let userCode = [];
let userEmail = [];

router.post("/forgot/checkEmail", async (req, res) => {
  const { email } = req.body;
  const Code = randomBytes(4).toString("hex");
  if (!email) {
    return res.status(404).json("Sorry, you did not enter your email");
  }
  const userCheck = await User.findOne({ email: email });

  if (!userCheck) {
    return res.status(404).json({ msg: "Sorry, this email is not registered" });
  } else {
    userEmail.push(email);
  }

  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAILL,
      pass: process.env.PASSWORD,
    },
  });

  const details = {
    from: "Login in Secret fode",
    to: email,
    subject: "Change Password using secret code",
    text: "secret code : " + Code,
  };
  mailTransport.sendMail(details, (err) => {
    if (err) {
      console.log(err);
    } else {
      userCode.push(Code);
      res
        .status(200)
        .json({ msg: "your email successfully sended secret code" });
    }
  });
});

router.post("/forgot/emailCodeCheck", (req, res) => {
  const { code } = req.body;
  const cod = userCode[0];
  if (code !== cod) {
    return res.status(403).json({ msg: "sorry code is wrong" });
  }

  if (code === cod) {
    res.status(200).json("Successfully");
  }
});

router.put("/forgot/passUpdate", async (req, res) => {
  const { password, confirmPassword } = req.body;
  // regex for password
  if (!/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{4,}$/.test(password)) {
    return res.status(422).json({
      error:
        "Sorry, your password must be at least 4 characters long, at least 1 uppercase and lowercase letter and 1 number!",
    });
  }

  if (password !== confirmPassword) {
    return res
      .status(403)
      .json(
        "Sorry, your new password does not match, please think of a new password"
      );
  }

  try {
    const hashPass = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { email: userEmail },
      {
        $set: { password: hashPass },
      },
      { new: true }
    );
    return res.status(200).json({msg:"password successfuly update"})
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
