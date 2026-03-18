# AI Grading System API

This is a project I made for an AI grading system. It is build with Node.js and Express and it uses the Groq AI model to grade student submissions automaticly. You can upload a students work and a marking guide, and the AI will evaluate it and give a score and some feedback.

## Features
- Upload student documents to get graded
- Upload a marking guide (optional but recommended)
- Add custom teacher instructions for the AI
- It saves all the grading results into a csv file `grading_results.csv`
- Simple chat endpoint if you want to just talk to the AI
- Added swagger documentation page so you can test the api easy

## How to setup and run
1. Make sure you have Node.js installed on your computer.
2. Open terminal in the project folder and run:
   ```
   npm install
   ```
   This will install all the dependents like express, multer, and groq-sdk.
3. You need to create a `.env` file in the root folder. Put your Groq API key in there like this:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   ```
4. To start the server run:
   ```
   npm run start
   ```
   or you can just do `node app.js`. The server will run on port 3000.

## Endpoints

- **GET `/`** 
  This serves the main frontend user interface. When you open this in your browser, you can directly upload your files and use the grading system!

- **GET `/api-docs`**
  This is the Swagger documentation page. You can see all endpoints and test them directly from your browser.

- **GET `/api-status`** 
  Just to test if the backend API is running fine.


- **POST `/upload`**
  This is the main endpoint. You have to send a `multipart/form-data` request.
  - `studentFile`: The file of the student (pdf, docx, etc)
  - `markingGuide`: The file with the answers (optional)
  - `teacherInstructions`: Any extra text instructions for grading
  
  It will return a JSON with the score and feedback, and also save it to the CSV.

- **POST `/chat`**
  Send a JSON body with a `message` to get a reply from the AI.

## Technologies I used
- Node.js & Express.js for the backend server
- **Groq SDK** for the fast AI inference
- **Multer** for file uploads handling
- **pdf-parse** and **mammoth** so it can read text from PDFs and Word documents
- **csv-writer** to save the grades
- **swagger-ui-express** and **swagger-jsdoc** to make the visual API documentation
