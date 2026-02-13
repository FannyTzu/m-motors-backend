// Suppress console.error during tests (errors are still handled properly)
// Keep only warnings and other logs for debugging if needed
jest.spyOn(console, 'error').mockImplementation(() => { });
