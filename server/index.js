const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
require("dotenv").config();
const app = express();

app.use(
  cors({
    origin: "https://hmac-fe.vercel.app",
    // origin: "http://localhost:5173",
    methods: ["GET", "PUT", "POST", "DELETE"],
    optionsSuccessStatus: 204,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "AJwefD809uasdj29a8ASasj28S";

const publicKey = "QWERasdf";
const privateKey = "NYMmsmcLn";

// Send public key
app.get("/public-key", (req, res) => {
  res.send(publicKey);
});
let decryptedMessage = "";
app.post("/receive", (req, res) => {
  const encryptedMessage = req.body.encryptedMessage;

  // Decrypt the message using the private key
  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(encryptedMessage, "base64")
  );

  const decryptedMessage = decryptedBuffer.toString("utf8");
  console.log("en " + encryptedMessage);
  console.log("de " + decryptedMessage);

  const data = { result: decryptedMessage };
  res.send(data);
});

console.log(process.env.MONGO_URL);
//0n772csUcpn9EfCI
mongoose.connect(process.env.MONGO_URL);

// Get email and check with HMAC
app.post("/hmacRegis", async (req, res) => {
  // Get message, hmac from request
  const { email, clientHmac } = req.body;

  // Get secret key from .env file
  const secretKey = process.env.SECRET_KEY_HMAC;
  // Generate HMAC with crypto library
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(email)
    .digest("base64");
  // Pack data
  const data = { email: email, hmac: hmac, result: "" };
  // Check HMAC and send response
  if (hmac == clientHmac) {
    data.result = "True HMAC";
    res.json(data);
  } else {
    data.result = "False HMAC, stop connecting now!!!";
    res.json(data);
  }
});

app.get("/profile", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (errors, data) => {
      if (errors) throw errors;
      const { name, email, _id } = await User.findById(data.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(422).json(error);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      const checkPs = bcrypt.compareSync(password, userDoc.password);
      if (checkPs) {
        jwt.sign(
          { email: userDoc.email, id: userDoc._id, name: userDoc.name },
          jwtSecret,
          {},
          (error, token) => {
            if (error) {
              throw error;
            }
            res
              .cookie("token", token, {
                maxAge: 3600 * 1000,
                secure: true,
                sameSite: "none",
              })
              .json(userDoc);
            console.log("ok");
            console.log(userDoc);
          }
        );
      } else {
        res.status(422).json("pass is not same");
      }
    } else {
      res.json("user not found");
    }
  } catch (error) {}
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json();
});

//   const newName = "photo" + Date.now() + ".jpg";
//   await imageDownloader.image({
//     url: link,
//     dest: "/tmp/" + newName,
//   });
//   const url = await uploadToS3(
//     "/tmp/" + newName,
//     newName,
//     mime.lookup("/tmp/" + newName)
//   );
//   res.json(url);
// });

// const photosMiddleware = multer({ dest: "/tmp" });
// app.post(
//   "/api/upload",
//   photosMiddleware.array("photos", 100),
//   async (req, res) => {
//     const uploadedFiles = [];
//     for (let i = 0; i < req.files.length; i++) {
//       const { path, originalname, mimetype } = req.files[i];
//       const url = await uploadToS3(path, originalname, mimetype);
//       uploadedFiles.push(url);
//     }
//     res.json(uploadedFiles);
//   }
// );

// app.post("/api/places", (req, res) => {
//   mongoose.connect(process.env.MONGO_URL);
//   const { token } = req.cookies;
//   const {
//     title,
//     address,
//     addedPhotos,
//     description,
//     price,
//     perks,
//     extraInfo,
//     checkIn,
//     checkOut,
//     maxGuests,
//   } = req.body;
//   jwt.verify(token, jwtSecret, {}, async (err, userData) => {
//     if (err) throw err;
//     const placeDoc = await Place.create({
//       owner: userData.id,
//       price,
//       title,
//       address,
//       photos: addedPhotos,
//       description,
//       perks,
//       extraInfo,
//       checkIn,
//       checkOut,
//       maxGuests,
//     });
//     res.json(placeDoc);
//   });
// });

// app.get("/api/user-places", (req, res) => {
//   mongoose.connect(process.env.MONGO_URL);
//   const { token } = req.cookies;
//   jwt.verify(token, jwtSecret, {}, async (err, userData) => {
//     const { id } = userData;
//     res.json(await Place.find({ owner: id }));
//   });
// });

// app.get("/api/places/:id", async (req, res) => {
//   mongoose.connect(process.env.MONGO_URL);
//   const { id } = req.params;
//   res.json(await Place.findById(id));
// });

app.listen(4000);
