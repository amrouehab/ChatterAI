
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

export default function setupMockApi() {
  // Create a new instance of axios-mock-adapter
  const mock = new MockAdapter(axios, { delayResponse: 1000 });

  // Mock authentication endpoints
  mock.onPost('/api/register').reply((config) => {
    const { username, password } = JSON.parse(config.data);
    
    // Validate input
    if (!username || !password) {
      return [400, { message: 'Username and password are required' }];
    }
    
    if (password.length < 6) {
      return [400, { message: 'Password must be at least 6 characters' }];
    }
    
    // Create a mock JWT token
    const token = `mock-jwt-token-${username}-${Date.now()}`;
    
    return [201, {
      message: 'User created successfully',
      token,
      user: { username }
    }];
  });

  mock.onPost('/api/login').reply((config) => {
    const { username, password } = JSON.parse(config.data);
    
    // Validate input
    if (!username || !password) {
      return [400, { message: 'Username and password are required' }];
    }
    
    // In a real app, we would validate credentials against a database
    // For demo purposes, any non-empty username/password is accepted
    
    // Create a mock JWT token
    const token = `mock-jwt-token-${username}-${Date.now()}`;
    
    return [200, {
      message: 'Login successful',
      token,
      user: { username }
    }];
  });

  // Mock chat endpoints
  mock.onGet('/api/chat').reply((config) => {
    // In a real app, we would fetch conversations from a database
    // For demo purposes, return empty array
    return [200, { conversations: [] }];
  });
  
  mock.onPost('/api/chat').reply((config) => {
    const { message } = JSON.parse(config.data);
    
    // In a real app, we would save the message to a database 
    // and process it through the LLM
    
    // For demo purposes, echo the message back
    return [200, {
      message: `Mock AI response to: "${message}"`
    }];
  });

  return mock;
}
