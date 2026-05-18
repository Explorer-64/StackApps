import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { collection, onSnapshot, query, where, type Firestore } from 'firebase/firestore';
import { initializeFirebase, getFirestoreDb } from '@/lib/firebase';
import type { Review } from '@shared/schema';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Props = {
  appId: string;
  user?: User | null;
  onReviewSubmit: (rating: number, comment: string) => Promise<void>;
};

export function ReviewSection({ appId, user, onReviewSubmit }: Props) {
  const [db, setDb] = useState<Firestore | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeFirebase()
      .then(() => getFirestoreDb())
      .then(setDb)
      .catch((err) => {
        console.error('Failed to init Firestore:', err);
      });
  }, []);

  useEffect(() => {
    if (!db || !appId) return;
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('appId', '==', appId));
    const unsub = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Review[];
      setReviews(reviewsList.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    });
    return () => unsub();
  }, [appId, db]);

  const handleRate = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await onReviewSubmit(rating, comment);
      setComment('');
      alert('Review submitted successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-cyber-gray rounded-xl shadow-lg border border-cyber-light p-6 md:p-8 mb-8">
      <div className="flex items-center justify-between mb-8 border-b border-cyber-light pb-4 gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-white">Reviews & Ratings</h2>
        <div className="text-sm text-gray-400">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-cyber-dark p-6 rounded-lg border border-cyber-light sticky top-4">
            <h3 className="text-lg font-bold text-white mb-4">Write a Review</h3>

            {user ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Rating</Label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl focus:outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-neon-yellow' : 'text-gray-600'}`}
                        data-testid={`button-star-${star}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Review</Label>
                  <Textarea
                    className="bg-cyber-black border-cyber-light text-white"
                    rows={4}
                    placeholder="What did you like or dislike?"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    data-testid="input-review"
                  />
                </div>

                <Button
                  onClick={handleRate}
                  disabled={submitting || !comment.trim()}
                  className="w-full bg-neon-green text-black font-bold hover:bg-white"
                  data-testid="button-submit-review"
                >
                  {submitting ? 'Posting...' : 'Post Review'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 mb-4">Log in to share your thoughts!</p>
                <Link
                  href="/login"
                  className="inline-block bg-neon-blue text-black font-bold py-2 px-6 rounded-sm hover:bg-white transition-colors shadow"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="border-b border-cyber-light last:border-0 pb-6 last:pb-0" data-testid={`review-${review.id}`}>
                  <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyber-dark border border-cyber-light flex items-center justify-center text-neon-blue font-bold shadow-sm overflow-hidden">
                        {review.userAvatarUrl ? (
                          <img src={review.userAvatarUrl} className="w-full h-full rounded-full object-cover" alt="User" />
                        ) : (
                          (review.userName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">{review.userName || 'Anonymous'}</div>
                        <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="flex text-neon-yellow text-sm">
                      {'★'.repeat(review.rating)}
                      <span className="text-gray-700">{'★'.repeat(5 - review.rating)}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-cyber-dark rounded-lg border border-dashed border-cyber-light">
                <h3 className="text-lg font-bold text-white mb-1">No reviews yet</h3>
                <p className="text-gray-500">Be the first to review this app!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

