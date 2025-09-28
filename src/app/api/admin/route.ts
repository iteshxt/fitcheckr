import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Admin endpoint to view collected emails using Vercel KV
// Protected with secret key for security

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';
const EMAILS_KEY = 'fitcheckr:subscribers';

async function getEmailsFromKV(): Promise<string[]> {
    try {
        const emails = await kv.get<string[]>(EMAILS_KEY);
        return emails || [];
    } catch (error) {
        console.error('Error getting emails from KV:', error);
        return [];
    }
}

export async function GET(request: NextRequest) {
    try {
        // Simple authentication check
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const emails = await getEmailsFromKV();

        return NextResponse.json({
            totalSubscribers: emails.length,
            emails: emails,
            timestamp: new Date().toISOString(),
            storageType: 'vercel-kv'
        });
    

} catch (error) {
    console.error('Admin endpoint error:', error);
    return NextResponse.json(
        { error: 'Failed to get subscriber data' },
        { status: 500 }
    );
}
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, action } = body;

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (action === 'export') {
            const emails = await getEmailsFromKV();            // Return as CSV format for easy export
            const csv = emails.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="fitcheckr-subscribers.csv"'
                }
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Admin endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to process admin action' },
            { status: 500 }
        );
    }
}