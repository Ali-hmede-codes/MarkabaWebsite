// Debug script to check environment variable loading
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('NEXT_PUBLIC_UPLOAD_URL:', process.env.NEXT_PUBLIC_UPLOAD_URL);
console.log('NEXT_PUBLIC_SERVER_URL:', process.env.NEXT_PUBLIC_SERVER_URL);
console.log('NEXT_PUBLIC_CLIENT_URL:', process.env.NEXT_PUBLIC_CLIENT_URL);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('\n=== Client-side Environment Check ===');
console.log('This script should be run on the server to verify environment loading.');
console.log('\nIf NEXT_PUBLIC_* variables are undefined, the issue is with environment loading.');
console.log('\nCommon fixes:');
console.log('1. Restart the Next.js development/production server');
console.log('2. Ensure .env file is in the correct location (project root)');
console.log('3. Check that .env file has proper permissions');
console.log('4. Verify no conflicting .env files exist');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('\n=== Browser Environment Variables ===');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('NEXT_PUBLIC_UPLOAD_URL:', process.env.NEXT_PUBLIC_UPLOAD_URL);
  console.log('NEXT_PUBLIC_SERVER_URL:', process.env.NEXT_PUBLIC_SERVER_URL);
  console.log('NEXT_PUBLIC_CLIENT_URL:', process.env.NEXT_PUBLIC_CLIENT_URL);
}