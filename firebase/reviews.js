import { db } from './firebase.js';

// Review management functions
export async function createReview(reviewData) {
  try {
    const reviewRef = await db.collection('reviews').add({
      ...reviewData,
      createdAt: new Date()
    });
    return reviewRef.id;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

export async function getReview(reviewId) {
  try {
    const reviewDoc = await db.collection('reviews').doc(reviewId).get();
    return reviewDoc.exists ? { id: reviewDoc.id, ...reviewDoc.data() } : null;
  } catch (error) {
    console.error('Error getting review:', error);
    throw error;
  }
}

export async function getReviews(product = 'all') {
  try {
    let reviewsSnapshot;
    
    if (product === 'all') {
      reviewsSnapshot = await db.collection('reviews').get();
    } else {
      reviewsSnapshot = await db.collection('reviews')
        .where('product', '==', product)
        .get();
    }
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by createdAt in descending order (newest first)
    reviews.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
      return dateB - dateA;
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }
}

export async function getUserReviews(userId) {
  try {
    const reviewsSnapshot = await db.collection('reviews')
      .where('userId', '==', userId)
      .get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by createdAt in descending order (newest first)
    reviews.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
      return dateB - dateA;
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw error;
  }
}

export async function deleteReview(reviewId) {
  try {
    await db.collection('reviews').doc(reviewId).delete();
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

export async function updateReview(reviewId, updateData) {
  try {
    await db.collection('reviews').doc(reviewId).update({
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

export async function getReviewStats() {
  try {
    const reviewsSnapshot = await db.collection('reviews').get();
    const stats = {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byProduct: {}
    };
    
    let totalRating = 0;
    
    reviewsSnapshot.forEach(doc => {
      const reviewData = doc.data();
      stats.total++;
      totalRating += reviewData.rating;
      
      // Count rating distribution
      if (stats.ratingDistribution[reviewData.rating] !== undefined) {
        stats.ratingDistribution[reviewData.rating]++;
      }
      
      // Count by product
      if (!stats.byProduct[reviewData.product]) {
        stats.byProduct[reviewData.product] = {
          total: 0,
          averageRating: 0,
          totalRating: 0
        };
      }
      stats.byProduct[reviewData.product].total++;
      stats.byProduct[reviewData.product].totalRating += reviewData.rating;
    });
    
    // Calculate averages
    if (stats.total > 0) {
      stats.averageRating = totalRating / stats.total;
    }
    
    // Calculate product averages
    Object.keys(stats.byProduct).forEach(product => {
      const productStats = stats.byProduct[product];
      if (productStats.total > 0) {
        productStats.averageRating = productStats.totalRating / productStats.total;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting review stats:', error);
    throw error;
  }
}

export async function getRecentReviews(limit = 10) {
  try {
    const reviewsSnapshot = await db.collection('reviews').get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by createdAt in descending order (newest first) and limit
    reviews.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
      return dateB - dateA;
    });
    
    return reviews.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent reviews:', error);
    throw error;
  }
}

export async function getTopRatedReviews(limit = 5) {
  try {
    const reviewsSnapshot = await db.collection('reviews')
      .where('rating', '==', 5)
      .get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by createdAt in descending order (newest first) and limit
    reviews.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
      return dateB - dateA;
    });
    
    return reviews.slice(0, limit);
  } catch (error) {
    console.error('Error getting top rated reviews:', error);
    throw error;
  }
} 