import fs from 'fs';
import path from 'path';

async function testUpload() {
    console.log("Starting API test...");
    
    const formData = new FormData();
    
    // Add student file
    const studentPath = path.join(process.cwd(), 'sample_student.txt');
    const studentBlob = new Blob([fs.readFileSync(studentPath)]);
    formData.append('studentFile', studentBlob, 'sample_student.txt');
    
    // Add guide file
    const guidePath = path.join(process.cwd(), 'sample_guide.txt');
    const guideBlob = new Blob([fs.readFileSync(guidePath)]);
    formData.append('markingGuide', guideBlob, 'sample_guide.txt');
    
    // Add instructions
    formData.append('teacherInstructions', 'Be strict on exact definitions.');
    
    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });
        
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testUpload();
