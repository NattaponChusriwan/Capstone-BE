const express = require("express");
const app = express();
const cors = require("cors");
const ImageRouter = require("./routers/ImageRouter");
const GetImageRouter = require("./routers/GetImageRouter");
const UserRouter = require("./routers/UserRouter");
const { jwtValidate } = require("./middleware/jwt");
require("dotenv").config();
require("./config/db").connect();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/image", jwtValidate, ImageRouter);
app.use("/api/images", GetImageRouter);
app.use("/api/user", UserRouter);

const PORT = 8080;
app.listen(PORT, function () {
  console.log(`listening on port ${PORT}`);
});
