const express = require("express");
const app = express();
const bookRouter = require("./routers/book");
const textRouter = require("./routers/text");
const userRouter = require("./routers/user");
const displayRouter = require("./routers/display");

app.use("/book", bookRouter);
app.use("/text", textRouter);
app.use("/user", userRouter);
app.use("/display", displayRouter);

app.listen(8080, () => {
    console.log("Server runnning...")
});