import { Schema, model } from "mongoose";

const User = model(
  "User",
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      password: { type: String, required: true },
      files: [],
    },
    {
      timestamps: true,
    }
  )
);

export default User;
