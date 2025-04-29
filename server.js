const express = require("express");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

// fallback if static middleware didn't catch it
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Apply rate limiting to API endpoints
app.use("/api/", apiLimiter);

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick",
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = response.choices[0].message.content;

    res.json({
      reply,
    });
  } catch (error) {
    console.error("Error:", error.message);

    res.status(500).json({
      error: "An error occurred while processing your request.",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Access the chatbot at http://localhost:${PORT}`);
});
