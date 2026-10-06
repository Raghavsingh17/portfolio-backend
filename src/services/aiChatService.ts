import { logger } from "../utils/logger.js";

const PORTFOLIO_CONTEXT = `
You are the AI Assistant for Raghav Singh's modern portfolio website.
Your role is to represent Raghav professionally, warmly, and concisely to visitors, recruiters, and clients.

ABOUT RAGHAV SINGH:
- Role: Frontend / Full-Stack Developer with 2.5+ years of experience
- Location: Noida / Bengaluru, India (Open for Remote & Worldwide roles)
- Bio: Full-Stack Developer & UI Engineer crafting fast, intuitive, and modern web applications.
- Core Skills: React, Next.js, TypeScript, JavaScript, Tailwind CSS, Node.js, Express.js, MongoDB, Three.js, Git.
- Email: raghavsingh7631@gmail.com
- LinkedIn: https://www.linkedin.com/in/raghav-singh-465494285/
- GitHub: https://github.com/Raghavsingh17

CRITICAL RULES & SCOPE RESTRICTIONS:
1. If the user greets you (e.g. "hi", "hello", "hey"), respond with: "Hi, How can I help you?"
2. You must ONLY answer questions directly related to Raghav Singh — his skills, background, work experience, projects, education, resume, and how to hire or get in touch with him.
3. If the user asks general programming definitions or tutorials (such as "what is react", "what is js", "explain python", "write a function") or general knowledge/unrelated topics (such as weather, politics, jokes):
   YOU MUST REFUSE to answer the generic question.
   Instead, respond with:
   "⚠️ **Question Out of Scope**\n\nI am Raghav's Portfolio AI Assistant, designed strictly to answer questions about Raghav's career, skills, projects, and hiring inquiries.\n\nI do not provide general technical tutorials. However, feel free to ask about Raghav's production experience with React and Next.js!"
4. Keep answers concise, accurate, and professional under 2-3 short bullet points.
`;

const getFallbackResponse = (message: string): string => {
  const lower = (message || "").toLowerCase();

  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
    return "Hi, How can I help you?";
  }
  if (lower.includes("skill") || lower.includes("tech") || lower.includes("stack")) {
    return "💻 **Raghav's Tech Stack:**\n• **Frontend:** React.js, Next.js, TypeScript, Tailwind CSS, Three.js\n• **Backend & DB:** Node.js, Express.js, MongoDB\n• **Tools:** Git, GitHub, REST APIs, Webpack, Postman";
  }
  if (lower.includes("project") || lower.includes("work")) {
    return "🚀 Raghav has engineered scalable web platforms, interactive 3D portfolios, and modern enterprise dashboards. Check out the **Projects** section for live demos and code!";
  }
  if (lower.includes("contact") || lower.includes("hire") || lower.includes("email") || lower.includes("reach")) {
    return "🤝 You can reach Raghav directly via email at [raghavsingh7631@gmail.com](mailto:raghavsingh7631@gmail.com) or submit your message through the Contact form below!";
  }
  if (lower.includes("resume") || lower.includes("cv")) {
    return "📄 You can view and download Raghav's latest resume using the **View Resume** button in the header!";
  }

  return "I am Raghav's Portfolio AI Assistant! Feel free to ask about Raghav's **skills, experience, projects, resume, or contact details**.";
};

interface ChatReplyResult {
  reply: string;
  source: string;
  error?: string;
}

export const generateChatReply = async ({ message }: { message: string; history?: any[] }): Promise<ChatReplyResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    logger.info("Using smart fallback AI response (GEMINI_API_KEY not configured).");
    return {
      reply: getFallbackResponse(message),
      source: "local-assistant",
    };
  }

  const trimmed = typeof message === "string" ? message.trim().toLowerCase() : "";
  if (/^(hi|hello|hey|hi there|hello there)[\s!.,?]*$/i.test(trimmed)) {
    return {
      reply: "Hi, How can I help you?",
      source: "greeting-engine",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${PORTFOLIO_CONTEXT}\n\nUser Question: ${message}` }],
            },
          ],
        }),
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return {
          reply: text.trim(),
          source: "gemini",
        };
      }
    }

    return {
      reply: getFallbackResponse(message),
      source: "fallback",
    };
  } catch (error: any) {
    logger.warn(`Gemini API notice (${error.message}). Returning fallback response.`);
    return {
      reply: getFallbackResponse(message),
      source: "fallback",
    };
  }
};