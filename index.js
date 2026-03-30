import express from "express";
import multer from "multer";
import axios from "axios";
import cors from "cors";
import FormData from "form-data";

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// 🔥 Upload to Telegram
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("document", req.file.buffer, req.file.originalname);

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      form,
      { headers: form.getHeaders() }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

// 🔥 Get images
app.get("/photos", async (req, res) => {
  try {
    const updates = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`
    );

    let urls = [];

    for (let u of updates.data.result) {
      if (u.message && u.message.document) {
        const fileId = u.message.document.file_id;

        const file = await axios.get(
          `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
        );

        const path = file.data.result.file_path;

        urls.push(`https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`);
      }
    }

    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching images");
  }
});

app.listen(3000, () => console.log("Server running"));
