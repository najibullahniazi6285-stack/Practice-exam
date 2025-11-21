CompTIA Security+ Practice Exam Simulator
Overview
This project is a web-based practice exam simulator for the CompTIA Security+ certification. It is designed to mimic the real exam environment by presenting 90 multiple-choice questions randomly selected from a larger pool, with a 90-minute time limit.

Features

Realistic Exam Format: 90 questions to be completed in 90 minutes.
Large Question Pool: Questions are randomly selected from a comprehensive questions.json file.
Timer Functionality: A countdown timer tracks your progress, with options to pause and resume.
Varied Question Types: Supports both single and multiple-answer questions.
Immediate Feedback: Automatically advances to the next question after an answer is submitted.
Detailed Results: At the end of the exam, view your final score and a list of incorrectly answered questions, complete with correct answers and reference links for further study.


File Structure

index.html: The main HTML file that structures the web page.
style.css: Contains all the styles for the application.
script.js: The core application logic, handling question loading, the timer, scoring, and user interactions.
questions.json: A JSON file containing the pool of exam questions, their possible answers, and references.


Future Enhancements
The next major feature in development is the inclusion of Performance-Based Questions (PBQs). This will involve:

Extending the questions.json schema to support new PBQ types (e.g., fill-in-the-blank, drag-and-drop).
Adding logic to script.js to render and evaluate the new interactive questions.
Updating index.html and style.css to accommodate the new PBQ elements.
