const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const jwtGenerate = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id},
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h", algorithm: "HS256"}
  );

  return accessToken;
};

const jwtRefreshTokenGenerate = (user) => {
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d", algorithm: "HS256" }
  );
  return refreshToken;
};

const jwtValidate = (req, res, next) => {
  try {
    if (!req.headers["authorization"]) return res.sendStatus(401);

    const token = req.headers["authorization"].replace("Bearer ", "");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) throw new Error(err); // Corrected from 'error' to 'err'
    });
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

// const jwtRefreshTokenValidate = (req, res, next) => {
//   try {
//     if (!req.headers["authorization"]) return res.sendStatus(401);
//     const token = req.headers["authorization"].replace("Bearer ", "");

//     jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
//       if (err) throw new Error(err); // Corrected from 'error' to 'err'
//       req.user = decoded;
//       req.user.token = token;
//       delete req.user.exp;
//       delete req.user.iat;
//     });
//     next();
//   } catch (error) {
//     return res.sendStatus(403);
//   }
// };
module.exports = {
  jwtGenerate,
  jwtRefreshTokenGenerate,
  jwtValidate,
};
