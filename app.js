import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import upload from './upload.js';
import { extractDocumentText } from './documentParser.js';
import { chat, evaluateSubmission } from './aiAccess.js';
import { saveGradingResult } from './csvStorage.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'AI Grading System API is running.' });
});

app.post('/chat', chat);

app.post('/upload', upload.fields([
    { name: 'studentFile', maxCount: 1 },
    { name: 'markingGuide', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files.studentFile) {
            return res.status(400).json({ error: 'Student file is required.' });
        }

        const studentFile = req.files.studentFile[0];
        console.log(`Processing student file: ${studentFile.originalname}`);
        const studentText = await extractDocumentText(studentFile.path);

        let markingGuideText = "";
        if (req.files.markingGuide) {
            const markingGuide = req.files.markingGuide[0];
            console.log(`Processing marking guide: ${markingGuide.originalname}`);
            markingGuideText = await extractDocumentText(markingGuide.path);
        }

        const teacherInstructions = req.body.teacherInstructions || "";

        console.log('Sending to AI for evaluation...');
        const aiResponseRaw = await evaluateSubmission(studentText, markingGuideText, teacherInstructions);
        
        // Parse the AI response (it should be strictly JSON, but we'll safely parse it)
        let aiResult = {};
        try {
            // Sometimes models return markdown wrappers like ```json ... ```. 
            // The prompt strictly says not to, but let's be safe.
            let cleanResponse = aiResponseRaw.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.substring(7);
                if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.substring(3);
                if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
            }
            aiResult = JSON.parse(cleanResponse);
            
            // Add original filename for the CSV record
            aiResult.filename = studentFile.originalname;
            
            // Save to CSV
            await saveGradingResult(aiResult);
            
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponseRaw);
            return res.status(500).json({ 
                error: 'AI returned invalid formatted response.', 
                rawResponse: aiResponseRaw 
            });
        }

        res.json({
            message: 'Evaluation completed successfully',
            filename: studentFile.originalname,
            result: aiResult
        });
    } catch (error) {
        console.error('Failed to process upload:', error);
        res.status(500).json({ error: error.message || 'Upload processing failed' });
    }
});

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});
