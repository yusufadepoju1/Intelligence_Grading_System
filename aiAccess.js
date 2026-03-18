import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.1-8b-instant"; // A better and widely available Groq model

export async function evaluateSubmission(studentText, markingGuideText = "", teacherInstructions = "") {
  // Construct a detailed prompt combining the provided texts
  let prompt = `Evaluate the following student submission.\n\n---\n[STUDENT SUBMISSION]\n${studentText}\n---\n`;

  if (markingGuideText && markingGuideText.trim() !== "") {
    prompt += `\n[MARKING GUIDE]\n${markingGuideText}\n---\n`;
  }

  if (teacherInstructions && teacherInstructions.trim() !== "") {
    prompt += `\n[TEACHER INSTRUCTIONS]\n${teacherInstructions}\n---\n`;
  }

  const systemMessage = `You are an AI assistant designed to help teachers grade student submissions.
      
Your task is to analyze the content of a student's uploaded file and extract the relevant information. Identify the student's answers and evaluate them according to the teacher's expected answers, marking guide, or instructions provided.

Return the result strictly in valid JSON format ONLY. Do not include explanations, comments, markdown blocks (like \`\`\`json), or any text outside the JSON object. The output must be machine-readable JSON.

If the uploaded file does not contain clear questions and answers, apply guardrails by indicating that the document is not a valid question-and-answer submission and return an appropriate message in the JSON response under 'remarks'.

Grade each answer based on correctness, completeness, and relevance.

Use the following JSON structure exactly:

{
  "student_info": {
    "name": "Extract if present, or leave empty string",
    "id": "Extract if present, or leave empty string",
    "level": ""
  },
  "questions": [
    {
      "question": "The question asked",
      "student_answer": "What the student wrote",
      "expected_answer": "The correct answer based on guide/knowledge",
      "score": "Score assigned",
      "max_score": "Maximum possible score",
      "feedback": "Constructive feedback on the answer"
    }
  ],
  "total_score": "Total score calculated",
  "max_total_score": "Total possible secure",
  "remarks": "Overall feedback or error messages"
}

Only return valid JSON following this structure.`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ],
    temperature: 0.1, // Lower temperature for more deterministic/structured output
    max_completion_tokens: 2048,
    top_p: 1,
    stream: false,
  });

  return completion.choices?.[0]?.message?.content ?? "";
}

export async function chat(req, res) {
  try {
    const userMessage = req.body?.message;
    if (!userMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userMessage },
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) res.write(content);
    }

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Chat failed" });
    else res.end();
  }
}
