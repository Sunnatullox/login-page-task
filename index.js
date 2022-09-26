 require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000; 
const mongoose = require("mongoose");
const Cors = require("cors")


app.use(Cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_SECRET_URL)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.log(err);
  });

  const swaggerUI = require("swagger-ui-express");
const Yaml = require("yamljs")
const SwaggerDoc  = Yaml.load("./apiDocs/api.yaml")
app.use("/api-doc", swaggerUI.serve, swaggerUI.setup(SwaggerDoc))

require("./models/users");


app.use("/api/auth",require("./routes/auth"));

app.listen(PORT, () => {
  console.log("Server listen on port " + PORT);
});
