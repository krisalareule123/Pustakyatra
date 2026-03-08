// API Configuration
const API_BASE_URL = "http://localhost:5001/api";

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Reader Authentication APIs
export const readerAPI = {
  // Register new reader
  register: async (userData) => {
    return apiCall("/readers/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Login reader
  login: async (credentials) => {
    return apiCall("/readers/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Get reader profile (protected)
  getProfile: async (token) => {
    return apiCall("/readers/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Author Authentication APIs (for future use)
export const authorAPI = {
  // Register new author
  register: async (userData) => {
    return apiCall("/authors/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Login author
  login: async (credentials) => {
    return apiCall("/authors/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Get author profile (protected)
  getProfile: async (token) => {
    return apiCall("/authors/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default { readerAPI, authorAPI };
