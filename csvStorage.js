import { createObjectCsvWriter } from 'csv-writer';
import fs from 'node:fs';
import path from 'node:path';

const CSV_FILE_PATH = path.join(process.cwd(), 'grading_results.csv');

export async function saveGradingResult(result) {
    const fileExists = fs.existsSync(CSV_FILE_PATH);
    
    const csvWriter = createObjectCsvWriter({
        path: CSV_FILE_PATH,
        header: [
            { id: 'timestamp', title: 'Timestamp' },
            { id: 'studentName', title: 'Student Name' },
            { id: 'studentId', title: 'Student ID' },
            { id: 'totalScore', title: 'Total Score' },
            { id: 'remarks', title: 'Remarks' },
            { id: 'filename', title: 'Filename' }
        ],
        append: fileExists
    });

    const record = {
        timestamp: new Date().toISOString(),
        studentName: result.student_info?.name || 'N/A',
        studentId: result.student_info?.id || 'N/A',
        totalScore: result.total_score || '0',
        remarks: result.remarks || 'N/A',
        filename: result.filename || 'N/A'
    };

    await csvWriter.writeRecords([record]);
    console.log(`Saved evaluation result to CSV for student ${record.studentName}`);
}
