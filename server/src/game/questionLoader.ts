import * as fs from 'fs';
import * as path from 'path';
import type { Question, QuestionSetInfo } from '../types/index.js';

const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');

export function loadQuestionSet(filename: string): Question[] {
  const filePath = path.join(QUESTIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Question set not found: ${filename}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const questions: Question[] = [];

  for (const line of lines) {
    const [text, reading] = line.split(',');
    if (text && reading) {
      questions.push({
        text: text.trim(),
        reading: reading.trim()
      });
    }
  }

  return questions;
}

export function getQuestionSets(): QuestionSetInfo[] {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(QUESTIONS_DIR);
  const sets: QuestionSetInfo[] = [];

  for (const file of files) {
    if (file.endsWith('.csv')) {
      const questions = loadQuestionSet(file);
      const name = file.replace('.csv', '');
      sets.push({
        id: file,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        questionCount: questions.length
      });
    }
  }

  return sets;
}

export function getRandomQuestions(filename: string, count: number): Question[] {
  const questions = loadQuestionSet(filename);
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
