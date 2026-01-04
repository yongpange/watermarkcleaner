
import { createAdminClient } from '../src/lib/supabase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkVerificationCodes() {
  try {
    console.log('Checking verification codes...');
    const supabase = createAdminClient();

    // Fetch the last 5 verification codes
    const { data, error } = await supabase
      .from('wmc_email_verification_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching codes:', error);
      return;
    }

    console.log(`Found ${data.length} records.`);
    
    // Log current server time
    const now = new Date();
    console.log('Current Server Time (Local):', now.toString());
    console.log('Current Server Time (ISO):', now.toISOString());

    data.forEach((record: any) => {
      console.log('------------------------------------------------');
      console.log(`ID: ${record.id}`);
      console.log(`Email: ${record.email}`);
      console.log(`Code: ${record.code}`);
      console.log(`Purpose: ${record.purpose}`);
      console.log(`Created At: ${record.created_at}`);
      console.log(`Expires At: ${record.expires_at}`);
      
      const createdAt = new Date(record.created_at);
      const expiresAt = new Date(record.expires_at);
      
      console.log(`Time since created: ${(now.getTime() - createdAt.getTime()) / 1000}s`);
      console.log(`Expires in: ${(expiresAt.getTime() - now.getTime()) / 1000}s`);
      
      if (record.created_at === null) {
        console.warn('WARNING: created_at is NULL!');
      }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkVerificationCodes();
