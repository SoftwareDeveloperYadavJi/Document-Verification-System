import express from "express";

import { router } from "./routes/v1";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use('/api/v1/user', router);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
