import { Request, Response } from 'express';
import pool from "../config/db";
import { GoogleGenAI } from '@google/genai';

// אתחול הלקוח של גוגל באמצעות מפתח ה-API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const suggestComment = async (req: Request, res: Response) => {
  try {
    const { prompt, postId } = req.body;

    if (!prompt || !postId) {
      return res.status(400).json({ error: 'Missing prompt or postId' });
    }

    // 1. שליפת תוכן הפוסט ממסד הנתונים
    const postQuery = 'SELECT content FROM posts WHERE id = $1';
    const postResult = await pool.query(postQuery, [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postContent = postResult.rows[0].content;

    // 2. בניית הפרומפט המאוחד (Context + User Request)
    const unifiedPrompt = `
      You are an advanced AI assistant embedded in a professional social network (similar to LinkedIn).
      The user is currently viewing a post with the following content:
      "${postContent}"

      The user is asking you the following:
      "${prompt}"

      Please provide a highly professional, contextual, and helpful response or draft a comment based on the post above.
    `;

    // 3. קריאה ל-Gemini 2.5 Flash האמיתי
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: unifiedPrompt,
    });

    // 4. החזרת התשובה שגוגל החזירה ישר אל הלקוח
    return res.json({ reply: response.text });

  } catch (error) {
    console.error('Error in AI Controller:', error);
    return res.status(500).json({ error: 'Internal server error during AI generation' });
  }
};