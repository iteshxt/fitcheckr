import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import promptConfig from '@/lib/prompt.json';

// Initialize Gemini AI with API key from environment variable
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json();
    const { userImage, articleImages } = body;

    console.log('⏳ try-on request received');

    // Validate inputs
    if (!userImage || !articleImages || !Array.isArray(articleImages) || articleImages.length === 0) {
      return NextResponse.json(
        { error: 'Both userImage and articleImages array are required' },
        { status: 400 }
      );
    }

    // Use first article image
    const articleImage = articleImages[0];

    // Prepare the prompt - using the prompt.json configuration
    const tryOnPrompt = [
      {
        inlineData: {
          mimeType: "image/png",
          data: userImage,
        },
      },
      {
        inlineData: {
          mimeType: "image/png",
          data: articleImage,
        },
      },
      {
        text: JSON.stringify(promptConfig, null, 2)
      },
    ];

    // Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: tryOnPrompt,
    });

    console.log('✅ try-on Completed');

    // Check if we got a valid response
    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    // Process the response
    const candidate = response.candidates[0];
    let generatedImageBase64 = null;
    let responseText = '';

    // Extract image from response
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          responseText += part.text;
        } else if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }
    } else {
      console.log('❌ No parts found in response');
    }

    // Return success response
    if (generatedImageBase64) {
      return NextResponse.json({
        success: true,
        message: 'Virtual try-on completed successfully',
        base64: generatedImageBase64,
        analysis: responseText || 'Image generated successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No image was generated',
        analysis: responseText || 'The model did not generate an image. Please try again.',
      }, { status: 422 });
    }

  } catch (error) {
    console.error('❌ Virtual try-on error:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Network error when connecting to Gemini API. Please check your internet connection and try again.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to process virtual try-on',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Virtual Try-On API is running',
    model: 'gemini-2.5-flash-image-preview',
    version: '1.0.0'
  });
}