describe('convex client', () => {
  const originalConvexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

  afterEach(() => {
    if (originalConvexUrl === undefined) {
      delete process.env.EXPO_PUBLIC_CONVEX_URL;
    } else {
      process.env.EXPO_PUBLIC_CONVEX_URL = originalConvexUrl;
    }
    jest.resetModules();
  });

  it('throws when the Convex url is missing', () => {
    delete process.env.EXPO_PUBLIC_CONVEX_URL;

    expect(() => {
      jest.isolateModules(() => {
        require('./convex');
      });
    }).toThrow('Missing Convex environment variable: EXPO_PUBLIC_CONVEX_URL');
  });
});
