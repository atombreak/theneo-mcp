import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the logger behavior, but since it writes to stderr,
// we'll mock console.error
describe('Logger', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Clear environment variable
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should mask API keys in logs', async () => {
    // Dynamically import logger to get fresh instance
    const { logger } = await import('../../../utils/logger.js');
    
    logger.info('API key: sk_test_1234567890');
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('[REDACTED');
    expect(logOutput).not.toContain('sk_test_1234567890');
  });

  it('should mask various secret patterns', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    const secrets = [
      'apiKey:sk_test_abc123',
      'api_key:sk_live_xyz789',
      'THENEO_API_KEY=sk_prod_secret',
      'token:pmak_postman123',
    ];

    secrets.forEach((secret) => {
      consoleErrorSpy.mockClear();
      logger.info(secret);
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toContain('[REDACTED');
    });
  });

  it('should log at different levels', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    // All should call console.error (stderr)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
  });

  it('should include metadata in logs', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    logger.info('Test message', { userId: 'user_123', action: 'create' });
    
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('user_123');
    expect(logOutput).toContain('create');
  });

  it('should handle errors in metadata', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    const error = new Error('Test error');
    logger.error('Error occurred', { error });
    
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('Test error');
  });

  it('should respect LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'error';
    
    // Re-import to get fresh instance with new env var
    delete require.cache[require.resolve('../../../utils/logger.js')];
    const { logger } = await import('../../../utils/logger.js');
    
    consoleErrorSpy.mockClear();
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.error('Error message');
    
    // Only error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    expect(logOutput).toContain('Error message');
  });

  it('should format log output as JSON', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    logger.info('Test', { key: 'value' });
    
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    // Should be parseable JSON
    expect(() => JSON.parse(logOutput)).not.toThrow();
  });

  it('should include timestamp in logs', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    logger.info('Test message');
    
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);
    expect(parsed.timestamp).toBeDefined();
    expect(new Date(parsed.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should include log level in output', async () => {
    const { logger } = await import('../../../utils/logger.js');
    
    logger.warn('Warning message');
    
    const logOutput = consoleErrorSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);
    expect(parsed.level).toBe('warn');
  });
});

