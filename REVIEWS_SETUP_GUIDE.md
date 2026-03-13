# Reviews & Ratings - Quick Setup Guide

## ✅ What's Already Done

1. **Database Table** - `reviews` table exists in your database
2. **Backend Controller** - `reviewController.js` created with all functions
3. **Backend Routes** - `review.routes.js` created and registered
4. **Frontend Component** - `ReviewSection.jsx` created
5. **Frontend Styles** - `ReviewSection.css` created
6. **API Integration** - `reviewAPI` added to `api.js`
7. **BookDetails Integration** - ReviewSection imported and added

## 🚀 How to Use

### Step 1: Restart Backend Server
```bash
cd Backend
npm start
```

You should see:
```
🚀 Server running on port 5001
```

### Step 2: Test the Feature

1. **Open any book details page** (e.g., http://localhost:5173/book/1)

2. **Scroll down to Reviews section** - You'll see:
   - "Ratings & Reviews" heading
   - Average rating display (0.0 initially)
   - "Write a Review" button

3. **Try without login:**
   - Click "Write a Review"
   - You'll see: "Please login to write a review"

4. **Login and try again:**
   - Login to your account
   - Go back to book details
   - Click "Write a Review"
   - Form appears with stars and textarea

5. **Submit a review:**
   - Click a star (1-5)
   - Write your review in the textarea
   - Click "Submit Review"
   - Success message appears
   - Your review shows in the list below

6. **Edit your review:**
   - Button now says "Edit Your Review"
   - Click it to modify your rating/text
   - Submit again - it updates (no duplicate)

## 📊 Check Database

Open phpMyAdmin → `pustakyatra` database → `reviews` table

You should see your review with:
- `review_id`
- `reader_id` (your user ID)
- `book_id` (the book you reviewed)
- `rating` (1-5)
- `comment` (your review text)
- `created_at` and `updated_at` timestamps

## 🎨 What You'll See

### Review Form
- Blue user icon
- "Share Your Thoughts" heading
- 5 yellow stars (clickable)
- Large textarea for review
- Blue "Submit Review" button
- Gray "Cancel" button

### Reviews List
- Each review shows:
  - Reviewer name
  - Star rating
  - Review text
  - Date posted

### Average Rating
- Large number (e.g., 4.5)
- Star visualization
- Total review count

## 🔧 Troubleshooting

### "Failed to submit review"
- Check backend server is running
- Check browser console for errors
- Verify you're logged in (check localStorage for token)

### Reviews not showing
- Check database has reviews for that book_id
- Check browser console for API errors
- Verify backend route is registered in server.js

### Can't click stars
- Make sure you're logged in
- Check browser console for JavaScript errors

## 📝 API Testing (Optional)

Test with Thunder Client or Postman:

**Get Reviews:**
```
GET http://localhost:5001/api/reviews/book/1
```

**Add Review (need token):**
```
POST http://localhost:5001/api/reviews
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "bookId": 1,
  "rating": 5,
  "reviewText": "Great book!"
}
```

## ✨ Features Working

✅ Click star to rate (1-5)
✅ Textarea appears after star click
✅ Submit review saves to database
✅ Reviews list shows all reviews
✅ Average rating calculates automatically
✅ Login required to submit
✅ One review per user per book
✅ Edit existing review
✅ Responsive design
✅ Success/error messages

## 🎯 Next Steps

The feature is complete and ready to use! You can now:
- Test with different users
- Add reviews to different books
- See average ratings update
- Edit and manage reviews

If you want to customize the design, edit:
- `Frontend/src/components/ReviewSection.css`

If you want to add more features, check:
- `Frontend/REVIEWS_RATINGS_COMPLETE.md` for detailed documentation
