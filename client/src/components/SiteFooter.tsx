import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export function SiteFooter() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [location] = useLocation();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const [{ initializeFirebase, getFirestoreDb }, { collection, addDoc, serverTimestamp }] =
        await Promise.all([import('@/lib/firebase'), import('firebase/firestore')]);
      await initializeFirebase();
      const db = await getFirestoreDb();

      await addDoc(collection(db, 'feedback'), {
        message: message.trim(),
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: serverTimestamp(),
        page: location,
        appId: 'stackapps',
      });

      toast({
        title: 'Feedback sent',
        description: 'Thank you for your feedback!',
      });
      
      setMessage('');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-cyber-dark border-t border-cyber-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
              StackApps
            </span>
            <span className="text-gray-400 text-sm">
              {new Date().getFullYear()}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/faq" className="text-gray-400 hover:text-neon-blue transition-colors" data-testid="link-faq">
              FAQ
            </Link>
            <Link href="/guides" className="text-gray-400 hover:text-neon-blue transition-colors" data-testid="link-guides-footer">
              Guides
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-neon-blue transition-colors" data-testid="link-privacy">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-neon-blue transition-colors" data-testid="link-terms">
              Terms
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  className="text-gray-400 hover:text-neon-blue transition-colors cursor-pointer"
                  data-testid="button-feedback"
                >
                  Feedback
                </button>
              </DialogTrigger>
              <DialogContent className="bg-cyber-dark border-cyber-light">
                <DialogHeader>
                  <DialogTitle className="text-white">Send Feedback</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Share your thoughts, report issues, or suggest improvements for StackApps.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px] bg-cyber-black border-cyber-light text-white placeholder:text-gray-500 resize-none"
                    data-testid="input-feedback-message"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setOpen(false)}
                      className="text-gray-400"
                      data-testid="button-feedback-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !message.trim()}
                      className="bg-neon-blue/20 border border-neon-blue text-neon-blue"
                      data-testid="button-feedback-submit"
                    >
                      {isSubmitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  {user && (
                    <p className="text-xs text-gray-400 text-center">
                      Sending as {user.email}
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </footer>
  );
}
