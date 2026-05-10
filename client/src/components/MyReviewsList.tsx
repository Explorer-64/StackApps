import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Review } from '@shared/schema';

type ReviewEditData = { rating: number; comment: string };

type Props = {
  reviews: Review[];
  reviewAppNames: Record<string, string>;
  onEdit: (review: Review) => void;
  onDelete: (appId: string, appName: string) => void;
  onCancelEdit: () => void;
  editingReviewId: string | null;
  reviewEditData: ReviewEditData;
  onReviewEditChange: Dispatch<SetStateAction<ReviewEditData>>;
  onReviewSave: (review: Review) => void;
  reviewSubmitting: boolean;
};

export function MyReviewsList({
  reviews,
  reviewAppNames,
  onEdit,
  onDelete,
  onCancelEdit,
  editingReviewId,
  reviewEditData,
  onReviewEditChange,
  onReviewSave,
  reviewSubmitting,
}: Props) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <span className="w-2 h-8 bg-neon-blue rounded-sm"></span>
        My Reviews
      </h2>

      <div className="bg-cyber-gray rounded-lg shadow-lg overflow-hidden border border-cyber-light">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No reviews yet.</p>
            <p className="mt-2 text-sm">
              <Link href="/dashboard" className="text-neon-blue hover:underline">Browse The Stackhouse</Link> to find apps to review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cyber-light">
            {reviews.map((review) => {
              const appName = reviewAppNames[review.appId] || review.appId;
              const isEditing = editingReviewId === review.id;
              return (
                <div key={review.id} className="p-6 hover:bg-cyber-dark transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <Link href={`/app/${review.appId}`} className="text-neon-blue hover:underline font-bold text-sm">
                        {appName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-neon-yellow text-sm">
                          {'★'.repeat(review.rating)}<span className="text-gray-700">{'★'.repeat(5 - review.rating)}</span>
                        </span>
                        <span className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      {isEditing ? (
                        <div className="space-y-3 mt-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => onReviewEditChange(d => ({ ...d, rating: star }))}
                                className={`text-2xl focus:outline-none transition-transform hover:scale-110 ${star <= reviewEditData.rating ? 'text-neon-yellow' : 'text-gray-600'}`}
                              >★</button>
                            ))}
                          </div>
                          <Textarea
                            value={reviewEditData.comment}
                            onChange={e => onReviewEditChange(d => ({ ...d, comment: e.target.value }))}
                            className="bg-cyber-dark border-cyber-light text-white"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => onReviewSave(review)}
                              disabled={reviewSubmitting || !reviewEditData.comment.trim()}
                              size="sm"
                              className="bg-neon-blue text-black font-bold hover:bg-white"
                            >
                              {reviewSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              onClick={onCancelEdit}
                              variant="outline"
                              size="sm"
                              className="border-cyber-light text-gray-300 hover:text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => onEdit(review)}
                          variant="outline"
                          size="sm"
                          className="border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => onDelete(review.appId, appName)}
                          variant="outline"
                          size="sm"
                          className="border-cyber-light text-gray-400 hover:text-red-500 hover:border-red-500"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

