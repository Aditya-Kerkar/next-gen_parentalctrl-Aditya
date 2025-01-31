export const extractDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      const parts = domain.split('.');
      return parts.length > 2 ? parts.slice(-2).join('.') : domain;
    } catch {
      return url;
    }
  };
  