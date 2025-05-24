import { connectDB } from "./db/db.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import User from "./models/User.js";

dotenv.config({
  path: "./.env",
});

const seedAdmin = async () => {
  try {
    const admin = await User.findOne({ role: "admin" });
    if(!admin){
      await User.create({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        role: "admin",
    });
  }
  } catch (error) {
    console.log("Error while creating admin", error);
  }
}

connectDB()
  .then(() => {
    seedAdmin();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`The server is running at ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database Connection failed", err);
  });
