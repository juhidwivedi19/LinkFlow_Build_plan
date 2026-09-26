const http=require("http");
require("dotenv").config();


require("./config/db.config.js");




const app = require("./app");

const port = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});