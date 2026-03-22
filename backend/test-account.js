const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/accounts';

// Test data
const testAccounts = [
  {
    email: 'testuser1@example.com',
    password: 'Password123!',
    username: 'testuser1',
    phone: '1234567890',
    accountType: 'customer',
    accountStatus: 'active'
  },
  {
    email: 'testuser2@example.com',
    password: 'Password456!',
    username: 'testuser2',
    phone: '0987654321',
    accountType: 'admin',
    accountStatus: 'active'
  }
];

async function testAccountCreation() {
  console.log('\n=== ACCOUNT CREATION TEST ===\n');
  
  try {
    // Test 1: Create first account
    console.log('🔵 Test 1: Creating first account...');
    const account1 = testAccounts[0];
    const response1 = await axios.post(API_BASE_URL, account1);
    console.log('✅ Success:', response1.data);
    const accountId1 = response1.data.data._id;
    
    // Test 2: Get all accounts
    console.log('\n🔵 Test 2: Getting all accounts...');
    const allAccounts = await axios.get(API_BASE_URL);
    console.log('✅ Success - Total accounts:', allAccounts.data.count);
    console.log('Accounts:', JSON.stringify(allAccounts.data.data, null, 2));
    
    // Test 3: Get account by ID
    console.log('\n🔵 Test 3: Getting account by ID...');
    const singleAccount = await axios.get(`${API_BASE_URL}/${accountId1}`);
    console.log('✅ Success:', singleAccount.data);
    
    // Test 4: Update account
    console.log('\n🔵 Test 4: Updating account...');
    const updateData = { username: 'updateduser1', phone: '5555555555' };
    const updatedAccount = await axios.put(`${API_BASE_URL}/${accountId1}`, updateData);
    console.log('✅ Success:', updatedAccount.data);
    
    // Test 5: Patch account
    console.log('\n🔵 Test 5: Patching account status...');
    const patchData = { accountStatus: 'inactive' };
    const patchedAccount = await axios.patch(`${API_BASE_URL}/${accountId1}`, patchData);
    console.log('✅ Success:', patchedAccount.data);
    
    // Test 6: Create duplicate email (should fail)
    console.log('\n🔵 Test 6: Attempting to create duplicate email (should fail)...');
    try {
      const response = await axios.post(API_BASE_URL, account1);
      console.log('❌ ERROR: Should have failed but succeeded!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected duplicate email:', error.response.data.message);
      } else {
        throw error;
      }
    }
    
    // Test 7: Missing required fields (should fail)
    console.log('\n🔵 Test 7: Missing required fields (should fail)...');
    try {
      const response = await axios.post(API_BASE_URL, { username: 'test' });
      console.log('❌ ERROR: Should have failed but succeeded!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected:', error.response.data.message);
      } else {
        throw error;
      }
    }
    
    // Test 8: Invalid ID format (should fail)
    console.log('\n🔵 Test 8: Invalid account ID format (should fail)...');
    try {
      const response = await axios.get(`${API_BASE_URL}/invalid-id`);
      console.log('❌ ERROR: Should have failed but succeeded!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid ID:', error.response.data.message);
      } else {
        throw error;
      }
    }
    
    // Test 9: Delete account
    console.log('\n🔵 Test 9: Deleting account...');
    const deletedAccount = await axios.delete(`${API_BASE_URL}/${accountId1}`);
    console.log('✅ Success:', deletedAccount.data);
    
    // Test 10: Verify account was deleted
    console.log('\n🔵 Test 10: Verifying account was deleted (should fail)...');
    try {
      const response = await axios.get(`${API_BASE_URL}/${accountId1}`);
      console.log('❌ ERROR: Account should have been deleted!');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly confirmed account deleted:', error.response.data.message);
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:\n');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.message) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

console.log('Starting tests in 2 seconds... Make sure your backend is running!');
setTimeout(testAccountCreation, 2000);
