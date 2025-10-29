// NFT minting has been retired; this endpoint now only returns a fixed response.
import { NextResponse } from 'next/server';

/**
 * NFT functionality has been removed from the platform.
 * Keep this endpoint to provide a predictable response for any lingering clients.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'NFT minting is no longer supported on Lovtiti Agro Mart.',
        details: 'This endpoint is intentionally disabled.'
      }
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'NFT minting is no longer supported on Lovtiti Agro Mart.'
      }
    },
    { status: 410 }
  );
}
