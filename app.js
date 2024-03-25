const express = require("express");
const app = express();
const cors = require("cors");
const ImageRouter = require("./routers/ImageRouter");
const GetImageRouter = require("./routers/GetImageRouter");
const UserRouter = require("./routers/UserRouter");
const CategoryRouter = require("./routers/CategoryRouter");
const RecipientRouter = require("./routers/RecipientRouter");
const PaymentRouter = require("./routers/PaymentRouter");
const CardRouter = require("./routers/CardRouter");
const OrderRouter = require("./routers/OrderDetailRouter"); 
const SaleRouter = require("./routers/SaleDetailRouter");
const bodyParser = require('body-parser');
const { jwtValidate } = require("./middleware/jwt");
require("dotenv").config();
require("./config/db").connect();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/image", jwtValidate, ImageRouter);
app.use("/api/images", GetImageRouter);
app.use("/api/user", UserRouter);
app.use("/api/category", CategoryRouter);
app.use("/api/recipient", RecipientRouter);
app.use("/api/card", CardRouter);
app.use("/api/order", OrderRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/sale", SaleRouter);

const PORT = 8080;
app.listen(PORT, function () {
  console.log(`listening on port ${PORT}`);
});
