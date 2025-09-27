import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userUrl, articleUrls } = body;

        if (!userUrl || !articleUrls || articleUrls.length === 0) {
            return NextResponse.json(
                { error: 'Missing userUrl or articleUrls' },
                { status: 400 }
            );
        }

        // Mock response for now - in production, this would call your AI service
        // For demo purposes, we'll return a placeholder base64 image
        const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' +
            'AAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
            '//8/w38GIAXDIBKE0DHxgljNBAAO' +
            '9TXL0Y4OHwAAAABJRU5ErkJggg==';
        return NextResponse.json({
            base64: mockBase64
        });

    } catch (error) {
        console.error('Try-on API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}