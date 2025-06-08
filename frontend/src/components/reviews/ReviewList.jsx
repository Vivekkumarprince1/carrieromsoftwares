import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/api';
import { Star, ChevronLeft, ChevronRight, Filter, User, Calendar, Briefcase } from 'lucide-react';

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 6,
    rating: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getApprovedReviews(filters);
      setReviews(response.data.reviews);
      setStats(response.data.stats);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Employee Reviews</h1>
          <p className="text-xl text-gray-600 mb-8">
            Authentic feedback from our team members and offer recipients
          </p>
          
          {/* Stats Summary */}
          {stats.totalReviews > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-2">
                    {renderStars(Math.round(stats.averageRating))}
                    <span className="ml-2 text-2xl font-bold text-gray-900">
                      {stats.averageRating}
                    </span>
                  </div>
                  <p className="text-gray-600">Average Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                  <p className="text-gray-600">Total Reviews</p>
                </div>
                <div className="text-center">
                  <div className="space-y-1">
                    {stats.ratingDistribution?.map(({ rating, count }) => (
                      <div key={rating} className="flex items-center justify-center text-sm">
                        <span className="w-8">{rating}★</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mx-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{
                              width: `${stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filter by:</span>
            </div>
            
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="rating-asc">Lowest Rated</option>
            </select>
          </div>
        </div>

        {/* Reviews Grid */}
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <p className="text-xl font-semibold">Error</p>
              <p>{error}</p>
            </div>
            <button
              onClick={fetchReviews}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No reviews found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.userName}</p>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{review.title}</h3>

                {/* Position & Department */}
                {(review.position || review.department) && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {review.position && <span>{review.position}</span>}
                    {review.position && review.department && <span className="mx-1">•</span>}
                    {review.department && <span>{review.department}</span>}
                  </div>
                )}

                {/* Content */}
                <p className="text-gray-700 mb-4 line-clamp-4">{review.content}</p>

                {/* Pros and Cons */}
                {(review.pros || review.cons) && (
                  <div className="space-y-2 mb-4">
                    {review.pros && (
                      <div>
                        <p className="text-sm font-semibold text-green-700">Pros:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.pros}</p>
                      </div>
                    )}
                    {review.cons && (
                      <div>
                        <p className="text-sm font-semibold text-red-700">Cons:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Advice */}
                {review.advice && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Advice to Management:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{review.advice}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-gray-500 capitalize">
                    {review.reviewerType.replace('_', ' ')}
                  </span>
                  {review.workType && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {review.workType}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handleFilterChange('page', page)}
                className={`px-3 py-2 border rounded-md ${
                  page === filters.page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
              disabled={filters.page === pagination.totalPages}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
