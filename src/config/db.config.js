import mongoose from "mongoose";

const connectionString = process.env.DB_CONNECTION_STRING;

export const connectDB = async () => {
  if (!connectionString) {
    console.error("❌ DB_CONNECTION_STRING is missing in .env file");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log(`\nDatabase Ready := ${db.connections[0].readyState === 1 ? "True" : "False"}\nDatabase Name := ${db.connection.name}\nDatabase Host := ${db.connection.host}\n`);
  } catch (error) {
    console.log("Database Connection Failed: ", error);
    process.exit(1);
  }
};
