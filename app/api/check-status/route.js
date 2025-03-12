// app/api/check-status/route.js
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get the browser ID from the request
    const { browserId } = await request.json();
    
    if (!browserId) {
      return NextResponse.json({
        success: true,
        cooldown: false
      });
    }
    
    // Get cooldown period from environment variables with a reasonable default
    const cooldownMinutes = parseInt(process.env.COOLDOWN_PERIOD_MINUTES || '60');
    const cooldownDate = new Date();
    cooldownDate.setMinutes(cooldownDate.getMinutes() - cooldownMinutes);

    // Check if user has claimed a coupon within the cooldown period
    const { data: recentClaims, error: claimError } = await supabase
      .from('claims')
      .select('claimed_at')
      .eq('browser_id', browserId)
      .gte('claimed_at', cooldownDate.toISOString());

    if (claimError) {
      console.error('Error checking recent claims:', claimError);
      return NextResponse.json(
        { success: false, error: 'Failed to check claim status' },
        { status: 500 }
      );
    }

    // If user has claimed recently, return time remaining
    if (recentClaims && recentClaims.length > 0) {
      // Find the oldest claim to calculate the most accurate next eligible time
      const oldestClaim = new Date(Math.min(...recentClaims.map(c => new Date(c.claimed_at))));
      const nextEligibleTime = new Date(oldestClaim);
      nextEligibleTime.setMinutes(nextEligibleTime.getMinutes() + cooldownMinutes);
      
      const timeRemaining = Math.max(0, Math.ceil((nextEligibleTime - new Date()) / (1000 * 60))); // minutes
      
      // Only return cooldown if there's time remaining
      if (timeRemaining > 0) {
        return NextResponse.json({
          success: true,
          cooldown: true,
          nextEligibleTime: nextEligibleTime.toISOString(),
          timeRemaining: timeRemaining
        });
      }
    }

    // User is eligible to claim
    return NextResponse.json({
      success: true,
      cooldown: false
    });
    
  } catch (error) {
    console.error('Unexpected error checking status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}