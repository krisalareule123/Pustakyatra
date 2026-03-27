// API Configuration
const API_BASE_URL = "http://localhost:5001/api";

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const { headers: extraHeaders, ...restOptions } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
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

  // Verify login OTP
  verifyLoginOTP: async (email, otp) => {
    return apiCall("/readers/verify-login-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  // Verify registration OTP
  verifyRegisterOTP: async (email, otp) => {
    return apiCall("/readers/verify-register-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
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

  // Update reader profile (protected)
  updateProfile: async (token, profileData) => {
    return apiCall("/readers/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },

  // Change password (protected)
  changePassword: async (token, passwordData) => {
    return apiCall("/readers/change-password", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });
  },

  // Forgot password - Request OTP
  forgotPassword: async (email) => {
    return apiCall("/readers/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Reset password with OTP
  resetPassword: async (resetData) => {
    return apiCall("/readers/reset-password", {
      method: "POST",
      body: JSON.stringify(resetData),
    });
  },

  // Verify email with OTP
  verifyEmail: async (verificationData) => {
    return apiCall("/readers/verify-email", {
      method: "POST",
      body: JSON.stringify(verificationData),
    });
  },

  // Resend OTP
  resendOTP: async (email, type) => {
    return apiCall("/readers/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, type }),
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

// Review APIs
export const reviewAPI = {
  // Add or update review
  addReview: async (token, reviewData) => {
    return apiCall("/reviews", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });
  },

  // Get reviews by book ID
  getReviewsByBook: async (bookId) => {
    return apiCall(`/reviews/book/${bookId}`, {
      method: "GET",
    });
  },

  // Get user's review for a book
  getUserReview: async (token, bookId) => {
    return apiCall(`/reviews/user/${bookId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Delete review
  deleteReview: async (token, reviewId) => {
    return apiCall(`/reviews/${reviewId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default { readerAPI, authorAPI, reviewAPI };
