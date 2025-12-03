const { ForumPost, User, Class } = require('../models');

describe('Simple Model Test', () => {
  it('should load models successfully', () => {
    expect(ForumPost).toBeDefined();
    expect(User).toBeDefined();
    expect(Class).toBeDefined();
  });

  it('should have correct model properties', () => {
    expect(typeof ForumPost.create).toBe('function');
    expect(typeof User.create).toBe('function');
    expect(typeof Class.create).toBe('function');
  });
});