# Reviews and Ratings Feature - Complete Implementation

## Overview
Complete reviews and ratings system integrated into Pustakyatra Book Details page.

## Database Schema

### Table: `reviews`
```sql
review_id       INT PRIMARY KEY AUTO_INCREMENT
reader_id       INT NOT NULL (FK to readers table)
book_id         INT NOT NULL
rating          INT NOT NULL (1-5)
comment         TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## Backend Implementation

### Files Created/Modified

#### 1. `Backend/src/controllers/reviewController.js`
Contains all review-related logic:

**Functions:**
- `addReview` - Add new review or update existing (one review per user per book)
- `getReviewsByBook` - Get all reviews for a book with average rating
- `getUserReview` - Get logged-in user's review for a specific book
- `deleteReview` - Delete user's own review

**Key Features:**
- Validates rating (1-5)
- Checks if user already reviewed (updates instead of duplicate)
- Calculates average rating automatically
- Joins with readers table to get reviewer names

#### 2. `Backend/src/routes/review.routes.js`
API routes for reviews:

**Public Routes:**
- `GET /api/reviews/book/:bookId` - Get all reviews for a book

**Protected Routes (require authentication):**
- `POST /api/reviews` - Add/update review
- `GET /api/reviews/user/:bookId` - Get user's review for a book
- `DELETE /api/reviews/:reviewId` - Delete review

#### 3. `Backend/src/server.js`
- Added review routes: `app.use("/api/reviews", reviewRoutes)`

## Frontend Implementation

### Files Created/Modified

#### 1. `Frontend/src/components/ReviewSection.jsx`
Main review component with full functionality:

**Features:**
- Displays average rating and total reviews
- Interactive 5-star rating system
- Review form with textarea
- Submit/Cancel buttons
- Reviews list with reader names and dates
- Login check before allowing reviews
- Prevents duplicate reviews (updates existing)
- Auto-refreshes after submission

**Props:**
- `bookId` - The book ID to fetch/submit reviews for

**State Management:**
- `reviews` - Array of all reviews
- `stats` - { totalReviews, averageRating }
- `userReview` - Current user's review (if exists)
- `showReviewForm` - Toggle review form visibility
- `rating` - Selected star rating (1-5)
- `reviewText` - Review comment text
- `loading` - Submission loading state
- `message` - Success/error messages
- `isLoggedIn` - User authentication status

#### 2. `Frontend/src/components/ReviewSection.css`
Complete styling for review section:
- Star rating styles (filled/empty)
- Review form container
- Review list items
- Responsive design
- Hover effects
- Button styles

#### 3. `Frontend/src/pages/BookDetails.jsx`
- Imported `ReviewSection` component
- Replaced placeholder review section with `<ReviewSection bookId={book.id} />`

#### 4. `Frontend/src/services/api.js`
Added `reviewAPI` object with functions:
- `addReview(token, reviewData)` - Submit review
- `getReviewsByBook(bookId)` - Fetch reviews
- `getUserReview(token, bookId)` - Get user's review
- `deleteReview(token, reviewId)` - Delete review

## User Flow

### 1. Viewing Reviews
1. User opens book details page
2. ReviewSection automatically fetches and displays:
   - Average rating (e.g., 4.5 ★★★★★)
   - Total number of reviews
   - List of all reviews with names and dates

### 2. Writing a Review (Logged In)
1. User clicks "Write a Review" button
2. Review form appears with:
   - User icon and header
   - 5 interactive stars
3. User clicks a star (1-5) to rate
4. Textarea appears for comment
5. User writes review (optional)
6. User clicks "Submit Review"
7. Review saves to database
8. Success message appears
9. Reviews list refreshes automatically
10. Form closes

### 3. Editing Existing Review
1. If user already reviewed, button shows "Edit Your Review"
2. Clicking opens form with existing rating and text
3. User can modify and resubmit
4. Backend updates existing review (no duplicate)

### 4. Not Logged In
1. User clicks star or "Write a Review"
2. Error message: "Please login to rate this book"
3. Form doesn't open
4. User must login first

## API Endpoints

### Add/Update Review
```
POST /api/reviews
Headers: Authorization: Bearer {token}
Body: {
  bookId: number,
  rating: number (1-5),
  reviewText: string (optional)
}
Response: {
  success: true,
  message: "Review submitted successfully",
  review: { review_id, reader_id, book_id, rating, review_text }
}
```

### Get Reviews by Book
```
GET /api/reviews/book/:bookId
Response: {
  success: true,
  reviews: [
    {
      review_id, reader_id, book_id, rating, review_text,
      created_at, updated_at, reader_name
    }
  ],
  stats: {
    totalReviews: number,
    averageRating: number
  }
}
```

### Get User's Review
```
GET /api/reviews/user/:bookId
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  review: { review_id, reader_id, book_id, rating, review_text, ... } | null
}
```

### Delete Review
```
DELETE /api/reviews/:reviewId
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  message: "Review deleted successfully"
}
```

## Testing Steps

### 1. Start Backend Server
```bash
cd Backend
npm start
```

### 2. Start Frontend Server
```bash
cd Frontend
npm run dev
```

### 3. Test Flow
1. **View Reviews (Not Logged In)**
   - Open any book details page
   - See existing reviews (if any)
   - See average rating
   - Try to click "Write a Review" → Should show login message

2. **Submit Review (Logged In)**
   - Login to the website
   - Open a book details page
   - Click "Write a Review"
   - Click a star (1-5)
   - Write a comment
   - Click "Submit Review"
   - Verify success message
   - Verify review appears in list

3. **Edit Review**
   - On same book, click "Edit Your Review"
   - Change rating or text
   - Submit again
   - Verify review updates (no duplicate)

4. **Check Database**
   - Open phpMyAdmin
   - Check `reviews` table
   - Verify data is saved correctly

## Features Implemented

✅ Interactive 5-star rating system
✅ Review textarea appears after star click
✅ Submit review with rating + comment
✅ Fetch and display all reviews for a book
✅ Show average rating on book details page
✅ Login check - prevents non-logged-in users
✅ One review per user per book (updates existing)
✅ Display reviewer names from readers table
✅ Show review dates
✅ Success/error messages
✅ Loading states
✅ Responsive design
✅ Professional UI matching design

## Database Constraints

- `UNIQUE KEY unique_reader_book (reader_id, book_id)` - Prevents duplicate reviews
- `CHECK (rating >= 1 AND rating <= 5)` - Validates rating range
- `FOREIGN KEY (reader_id)` - Links to readers table
- `ON DELETE CASCADE` - Deletes reviews when reader is deleted

## Security

- All write operations require authentication (JWT token)
- Middleware validates token before allowing review submission
- Users can only delete their own reviews
- SQL injection prevention through parameterized queries
- Input validation on both frontend and backend

## Future Enhancements (Optional)

- Add "helpful" votes for reviews
- Sort reviews by date/rating/helpfulness
- Add review images
- Report inappropriate reviews
- Admin moderation panel
- Email notifications for new reviews
- Review reply feature for authors
