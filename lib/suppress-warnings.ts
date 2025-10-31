// Suppress development warnings
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: unknown[]) => {
    const [message] = args;

    // Suppress specific warnings
    if (
      typeof message === 'string' && (
        message.includes('Download the React DevTools') ||
        message.includes('Clerk has been loaded with development keys') ||
        message.includes('has "fill" and parent element with invalid "position"') ||
        message.includes('Extra attributes from the server') ||
        message.includes('Warning: Extra attributes from the server')
      )
    ) {
      return; // Suppress these warnings
    }

    // Allow other warnings and console.log
    originalWarn(...(args as Parameters<typeof console.warn>));
  };

  console.error = (...args: unknown[]) => {
    const [message] = args;

    // Suppress specific errors
    if (
      typeof message === 'string' && (
        message.includes('Download the React DevTools') ||
        message.includes('Clerk has been loaded with development keys') ||
        message.includes('Extra attributes from the server') ||
        message.includes('Warning: Extra attributes from the server') ||
        message.includes('cz-shortcut-listen')
      )
    ) {
      return; // Suppress these errors
    }

    // Allow other errors
    originalError(...(args as Parameters<typeof console.error>));
  };
}

// Suppress Clerk development warning specifically
if (typeof window !== 'undefined') {
  // Override console methods to filter out Clerk development warnings
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || '');

    // Filter out Clerk development warnings
    if (
      message.includes('Clerk has been loaded with development keys') ||
      message.includes('Development instances have strict usage limits') ||
      message.includes('Extra attributes from the server')
    ) {
      return;
    }

    originalConsoleWarn(...(args as Parameters<typeof console.warn>));
  };

  console.error = (...args: unknown[]) => {
    const message = String(args[0] || '');

    // Filter out specific errors
    if (
      message.includes('Warning: Extra attributes from the server') ||
      message.includes('cz-shortcut-listen')
    ) {
      return;
    }

    originalConsoleError(...(args as Parameters<typeof console.error>));
  };
}
