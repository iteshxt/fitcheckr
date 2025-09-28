import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Using Vercel Blob for persistent email storage
// Emails are stored in a JSON file with read/write capabilities

const BLOB_FILENAME = 'subscribers.json';

interface SubscriberData {
    emails: string[];
    count: number;
    lastUpdated: string;
}

async function getSubscribersFromBlob(): Promise<SubscriberData> {
    try {
        // Try to get existing blob
        const response = await fetch(`https://${process.env.BLOB_READ_WRITE_TOKEN?.split('_')[1]}.public.blob.vercel-storage.com/${BLOB_FILENAME}`);

        if (response.ok) {
            const data = await response.json() as SubscriberData;
            return data;
        }

        // Return empty data if blob doesn't exist
        return {
            emails: [],
            count: 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting subscribers from Blob:', error);
        return {
            emails: [],
            count: 0,
            lastUpdated: new Date().toISOString()
        };
    }
}

async function saveSubscribersToBlob(data: SubscriberData): Promise<boolean> {
    try {
        const jsonData = JSON.stringify(data, null, 2);

        const blob = await put(BLOB_FILENAME, jsonData, {
            access: 'public',
            contentType: 'application/json',
        });

        console.log('Saved subscribers to blob:', blob.url);
        return true;
    } catch (error) {
        console.error('Error saving subscribers to Blob:', error);
        return false;
    }
} export async function POST(request: NextRequest) {
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

        // Get current subscribers
        const currentData = await getSubscribersFromBlob();

        // Check if email already exists
        if (currentData.emails.includes(email)) {
            return NextResponse.json(
                { message: 'Email already subscribed', totalSubscribers: currentData.count },
                { status: 200 }
            );
        }

        // Add new email
        const updatedData: SubscriberData = {
            emails: [...currentData.emails, email],
            count: currentData.count + 1,
            lastUpdated: new Date().toISOString()
        };

        // Save to blob
        const saved = await saveSubscribersToBlob(updatedData);

        if (!saved) {
            return NextResponse.json(
                { error: 'Failed to save email subscription' },
                { status: 500 }
            );
        }

        console.log('New email subscriber:', email);
        console.log('Total subscribers:', updatedData.count);

        return NextResponse.json({
            message: 'Email subscribed successfully',
            totalSubscribers: updatedData.count
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
        const data = await getSubscribersFromBlob();
        return NextResponse.json({
            totalSubscribers: data.count,
            message: `Total subscribers: ${data.count}`,
            lastUpdated: data.lastUpdated,
            storageType: 'vercel-blob'
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscribers' },
            { status: 500 }
        );
    }
}