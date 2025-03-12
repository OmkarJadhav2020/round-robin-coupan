// app/api/claim-coupon/route.js
import { supabase } from '@/lib/supabaseClient';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Error handling wrapper for the entire function
  try {
    // Get the user's IP address with fallbacks
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    
    // Generate a unique browser ID for new users
    const newBrowserId = nanoid(12);
    
    let browserId;
    
    try {
      // Parse the request body
      const body = await request.json().catch(() => ({}));
      browserId = body.browserId || newBrowserId;
    } catch (error) {
      console.error('Error parsing request body:', error);
      browserId = newBrowserId;
    }

    // Get cooldown period from environment variables with a reasonable default
    const cooldownMinutes = parseInt(process.env.COOLDOWN_PERIOD_MINUTES || '60');
    const cooldownDate = new Date();
    cooldownDate.setMinutes(cooldownDate.getMinutes() - cooldownMinutes);

    // Check if user has claimed a coupon within the cooldown period
    const { data: recentClaims, error: claimError } = await supabase
      .from('claims')
      .select('claimed_at')
      .or(`ip_address.eq.${ipAddress},browser_id.eq.${browserId}`)
      .gte('claimed_at', cooldownDate.toISOString());

    if (claimError) {
      console.error('Error checking recent claims:', claimError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to check claim eligibility', 
          message: 'We encountered an issue checking your eligibility. Please try again later.'
        },
        { status: 500 }
      );
    }

    // If user has claimed recently, return time remaining
    if (recentClaims && recentClaims.length > 0) {
      // Find the oldest claim to calculate the most accurate next eligible time
      const oldestClaim = new Date(Math.min(...recentClaims.map(c => new Date(c.claimed_at))));
      const nextEligibleTime = new Date(oldestClaim);
      nextEligibleTime.setMinutes(nextEligibleTime.getMinutes() + cooldownMinutes);
      
      const timeRemaining = Math.max(1, Math.ceil((nextEligibleTime - new Date()) / (1000 * 60))); // minutes, minimum 1
      
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `You can claim another coupon in ${timeRemaining} minute${timeRemaining === 1 ? '' : 's'}`,
          nextEligibleTime: nextEligibleTime.toISOString(),
          cooldown: true
        },
        { status: 429 }
      );
    }

    // Get the next available coupon using round-robin fashion (least recently assigned first)
    const { data: coupons, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('last_assigned_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (couponError) {
      console.error('Error fetching coupons:', couponError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch coupons', 
          message: 'We couldn\'t retrieve available coupons. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Handle no available coupons
    if (!coupons || coupons.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No coupons available',
          message: 'There are no active coupons available at the moment. Please check back later.' 
        },
        { status: 404 }
      );
    }

    const coupon = coupons[0];
    const currentTime = new Date().toISOString();

    // Update the coupon's last_assigned_at timestamp
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ last_assigned_at: currentTime })
      .eq('id', coupon.id);

    if (updateError) {
      console.error('Error updating coupon timestamp:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to assign coupon', 
          message: 'We encountered an issue assigning your coupon. Please try again.'
        },
        { status: 500 }
      );
    }

    // Record the claim
    const { error: claimInsertError } = await supabase
      .from('claims')
      .insert({
        coupon_id: coupon.id,
        ip_address: ipAddress,
        browser_id: browserId,
        claimed_at: currentTime
      });

    if (claimInsertError) {
      console.error('Error recording claim:', claimInsertError);
      // Continue anyway since the user has the coupon, just log the error
    }

    // Create the successful response with the coupon and browser ID
    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description
      },
      browserId: browserId,
      message: 'Coupon claimed successfully!'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        message: 'An unexpected error occurred. Please try again later.',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

// Add check-status endpoint to verify if user is in cooldown
export async function OPTIONS(request) {
  return NextResponse.json({
    status: 'ok'
  });
}