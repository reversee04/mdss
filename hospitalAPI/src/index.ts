import Express  from "express";
import cron from "node-cron";
import { syncToMDSS } from "./api/getAll";

const app = Express();

app.use(Express.json());

const PORT = process.env.PORT || 4000;

// manuala route trigger
app.get("/sync-now", async (req, res) => {
    await syncToMDSS();
    res.send("Sync triggered");
});

// schedule sync every 5 minutes
let isRunning = false;
cron.schedule("*/5 * * * *", async () => {
    if (isRunning) return; // prevent overlapping runs
    isRunning = true;
    console.log("Running scheduled sync to MDSS...");
    await syncToMDSS();
    isRunning = false;
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});