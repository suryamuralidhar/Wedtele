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

// 💾 Store uploaded file URLs (temporary memory)
let storedFiles = [];

// 🔥 Upload to Telegram + store URL
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("document", req.file.buffer, req.file.originalname);

    // 📤 Send to Telegram
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      form,
      { headers: form.getHeaders() }
    );

    // 📥 Get file_id from Telegram response
    const fileId = response.data.result.document.file_id;

    // 🔍 Get file path
    const file = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    const path = file.data.result.file_path;

    // 🌐 Build public URL
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`;

    // 💾 Save in memory
    storedFiles.push(fileUrl);

    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Upload failed");
  }
});

// 🔥 Get stored files
app.get("/photos", (req, res) => {
  res.json(storedFiles);
});

// 🌍 Root check (optional but useful)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ⚠️ IMPORTANT: dynamic port for Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
