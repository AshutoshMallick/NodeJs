const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../mongoose/models/admin");
const Players = require("../mongoose/models/players");
const adminAuth = require("../middlewares/adminAuth");

const adminRouter = express.Router();

// Admin login
adminRouter.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    const admin = await Admin.findOne({ name, password });

    if (!admin) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: admin._id }, "xeEo2M0ol8CeWr7Nw2g2GjH8QEUK4dyyKCHi4TYJK6znm5fuAHIIPHSQ5YvdVcLlnaxppN64xK6xbhRileWvIlzCEqrBMCiITD8z");
    admin.tokens.push({ token });
    await admin.save();

    res.send({ admin, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Add new player
adminRouter.post("/addPlayer", adminAuth, async (req, res) => {
  try {
    const player = new Players(req.body);
    await player.save();
    res.status(201).send(player);
  } catch (error) {
    res.status(400).send(error);
  }
});
// Add new player with invalid name
adminRouter.post("/addPlayer", adminAuth, async (req, res) => {
  try {
    console.log("Received Name:", req.body.name); // Debugging

    if (!req.body.name || req.body.name.length < 3) {
      console.log("Name validation failed"); // Debugging
      return res.status(400).send({ error: "Name must be at least 3 characters long." });
    }
    if (!req.body.age || req.body.age < 15) {
      console.log("Invald Age"); // Debugging
      return res.status(400).send({ error: "Age should be more than 15." });
    }
    if (!["Batsman", "Bowler", "All-rounder"].includes(req.body.type)) {
      console.log("Validation failed: Invalid type");
      return res.status(400).send({ error: "Invalid player type." });
    }
    if (!["Right", "Left"].includes(req.body.bats)) {
      console.log("Validation failed: Invalid BATS");
      return res.status(400).send({ error: "Invalid player BATS." });
    }
    if (!["Medium", "Fast", "Spin"].includes(req.body.bowling_style)) {
      console.log("Validation failed: Invalid bowling_style");
      return res.status(400).send({ error: "Invalid player bowling_style." });
    }
    const player = new Players(req.body);
    await player.save();
    res.status(201).send(player);
  } catch (e) {
    console.error("Error in adding player:", e); // Debugging
    res.status(400).send(e);
  }
});

// View a player profile
adminRouter.get("/viewPlayer/:id", adminAuth, async (req, res) => {
  try {
    const player = await Players.findById(req.params.id);
    if (!player) {
      return res.status(404).send();
    }
    res.send(player);
  } catch (error) {
    res.status(500).send();
  }
});

// Update player details
adminRouter.patch("/editPlayer/:id", adminAuth, async (req, res) => {
  try {
    const player = await Players.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!player) {
      return res.status(404).send();
    }
    res.send(player);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete player
adminRouter.delete("/deletePlayer/:id", adminAuth, async (req, res) => {
  try {
    const player = await Players.findByIdAndDelete(req.params.id);
    if (!player) {
      return res.status(404).send();
    }
    res.send({ message: "Player deleted successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});
// View a player profile CSK
adminRouter.get("/viewPlayers/:teamName", adminAuth, async (req, res) => {
  try {
    const team = req.params.teamName;
    const players = await Players.find({ bought_by: team });
    // req.params.teamName
    if (!players) {
      return res.status(404).send();
    }
    res.send(players);
  } catch (error) {
    res.status(500).send();
  }
});
adminRouter.patch("/playerBought/:id", adminAuth, async (req, res) => {
  try {
      const player = await Players.findById(req.params.id);
      if (!player) {
          return res.status(404).send({ error: "Player not found" });
      }
      player.unsold = false;
      if( player.bought_by !== undefined){
        player.bought_by = player.bidded_by !== undefined ? player.bidded_by : "";
      }
      await player.save();
      res.status(200).send(player);
  } catch (error) {
      console.error("Error updating player:", error);
      res.status(400).send({ error: "Failed to update player" });
  }
});
adminRouter.patch("/players/bid/:id", adminAuth, async (req, res) => {
  try {
      const player = await Players.findById(req.params.id);
      if (!player) {
          return res.status(404).send({ error: "Player not found" });
      }
      player.bidded_by = req.body.teamName;
      player.sold_price = player.sold_price === undefined ? 0 : player.sold_price;
      if( player.sold_price !== undefined){
        player.sold_price = (player.sold_price === 0) ? player.base_price : player.sold_price;
        if(1000000 <= player.sold_price && player.sold_price < 10000000){
          player.sold_price += 500000;
        }else if(10000000 <= player.sold_price &&  player.sold_price < 50000000){
          player.sold_price += 1000000;
        }else if(50000000 <= player.sold_price && player.sold_price < 100000000){
          player.sold_price += 2500000;
        }else if(100000000 <= player.sold_price && player.sold_price < 200000000){
          player.sold_price += 5000000;
        }else if(200000000 <= player.sold_price){
          player.sold_price += 10000000;
        }
      }
      
      
      await player.save();
      res.status(200).send(player);
  } catch (error) {
      console.error("Error updating player:", error);
      res.status(400).send({ error: "Failed to update player" });
  }
});
adminRouter.get("/displayPlayer/:count", adminAuth, async (req, res) => {
  try {
    const count = req.params.count;
    const type = req.query.type;
    const playerLst = await Players.find({ displayed_count: count, type : type, unsold : true }).sort('-base_price');
    playerLst[0].displayed_count += 1;
    const players = [playerLst[0]];
    await Players.updateOne({_id:players[0]._id},players[0]);
    if (!players) {
      return res.status(404).send();
    }
    // await playerLst.save();
    res.send(players);
  } catch (error) {
    res.status(500).send();
  }
});
module.exports = adminRouter;