import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Using Vercel KV for persistent email storage
// Configure KV environment variables in your Vercel dashboard

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

async function saveEmailsToKV(emails: string[]): Promise<boolean> {
    try {
        await kv.set(EMAILS_KEY, emails);
        return true;
    } catch (error) {
        console.error('Error saving emails to KV:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Get current emails
        const currentEmails = await getEmailsFromKV();

        // Check if email already exists
        if (currentEmails.includes(email)) {
            return NextResponse.json(
                { message: 'Email already subscribed', totalSubscribers: currentEmails.length },
                { status: 200 }
            );
        }

        // Add new email
        const updatedEmails = [...currentEmails, email];
        const saved = await saveEmailsToKV(updatedEmails);

        if (!saved) {
            return NextResponse.json(
                { error: 'Failed to save email subscription' },
                { status: 500 }
            );
        }

        console.log('New email subscriber:', email);
        console.log('Total subscribers:', updatedEmails.length);

        return NextResponse.json({
            message: 'Email subscribed successfully',
            totalSubscribers: updatedEmails.length
        });

    } catch (error) {
        console.error('Email subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to process subscription' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const emails = await getEmailsFromKV();
        return NextResponse.json({
            totalSubscribers: emails.length,
            message: `Total subscribers: ${emails.length}`,
            storageType: 'vercel-kv'
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscribers' },
            { status: 500 }
        );
    }
}