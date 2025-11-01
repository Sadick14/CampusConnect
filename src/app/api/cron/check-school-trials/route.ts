import { NextRequest, NextResponse } from 'next/server';
import { lockExpiredSchools } from '@/services/school-status';

export async function POST(request: NextRequest) {
  try {
    // In production, you should add authentication to protect this endpoint
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Running automated school trial expiry check...');
    
    const result = await lockExpiredSchools();
    
    console.log(`Automated check completed: ${result.locked} schools locked, ${result.errors.length} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Processed school trials: ${result.locked} schools locked`,
      locked: result.locked,
      errors: result.errors
    });

  } catch (error) {
    console.error('Error in automated school check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process school trials',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Provide information about the cron job
  return NextResponse.json({
    endpoint: '/api/cron/check-school-trials',
    description: 'Automated job to check and lock expired school trials',
    method: 'POST',
    schedule: 'Run daily at 9:00 AM',
    lastRun: new Date().toISOString()
  });
}