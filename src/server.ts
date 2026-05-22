import express from "express";
import app from "./app";
import config from "./config";
import "./db";

const main = async () => {
    app.listen(config.port, () => {
        console.log(`server is running on port ${config.port}`);
    });
};

main();