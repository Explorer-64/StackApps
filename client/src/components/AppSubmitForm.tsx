import { useEffect, useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { App } from '@shared/schema';

type FormData = {
  name: string;
  description: string;
  thumbnailUrl: string;
  appUrl: string;
  category: string;
  tags: string;
};

type Props = {
  editingApp: App | null;
  ownerId: string;
  onSubmit: (appData: Omit<App, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function AppSubmitForm({ editingApp, ownerId, onSubmit, onCancel, isSubmitting }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    thumbnailUrl: '',
    appUrl: '',
    category: '',
    tags: '',
  });

  useEffect(() => {
    if (!editingApp) {
      setFormData({ name: '', description: '', thumbnailUrl: '', appUrl: '', category: '', tags: '' });
      return;
    }

    setFormData({
      name: editingApp.name,
      description: editingApp.description,
      thumbnailUrl: editingApp.thumbnailUrl,
      appUrl: editingApp.appUrl,
      category: editingApp.category || '',
      tags: editingApp.tags?.join(', ') || '',
    });
  }, [editingApp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const appData: Omit<App, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      appUrl: formData.appUrl,
      category: formData.category || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      ownerId,
    };

    await onSubmit(appData);
  };

  return (
    <div className="bg-cyber-gray rounded-lg shadow-xl p-6 mb-8 border border-cyber-light">
      <h2 className="text-2xl font-bold text-white mb-6">
        {editingApp ? 'Edit App Details' : 'Submit New App'}
      </h2>
      {!editingApp && (
        <div className="bg-cyber-black border border-cyber-light rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ['🔗', 'Dofollow backlink', 'A server-rendered page at stackapps.app/apps/[slug]'], ['🛡️', 'StackApps Verified badge', 'Embeddable SVG at stackapps.app/api/badge/[id].svg'], ['✅', 'Readiness scan', '10 checks: llms.txt, PWA, Blueprint Protocol & more'],
            ].map(([icon, label, description]) => (
              <div key={label} className="flex gap-3">
                <span className="text-lg leading-none">{icon}</span>
                <div>
                  <p className="text-sm font-bold text-neon-blue">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">Only live-approved apps receive these. Building approvals are listed but do not trigger the scan or badge.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">App Name *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-cyber-dark border-cyber-light text-white"
              placeholder="My Awesome App"
              data-testid="input-app-name"
              data-agent-id="listing-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appUrl" className="text-gray-300">App URL *</Label>
            <Input
              id="appUrl"
              type="url"
              required
              value={formData.appUrl}
              onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })}
              className="bg-cyber-dark border-cyber-light text-white"
              placeholder="https://myapp.example.com"
              data-testid="input-app-url"
              data-agent-id="listing-url"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-300">Description *</Label>
          <Textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-cyber-dark border-cyber-light text-white"
            placeholder="A brief description of what your app does..."
            rows={3}
            data-testid="input-description"
            data-agent-id="listing-description"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Thumbnail Image</Label>
          <ImageUpload
            currentImageUrl={formData.thumbnailUrl}
            onImageUploaded={(url) => setFormData({ ...formData, thumbnailUrl: url })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-300">Category</Label>
            <Input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="bg-cyber-dark border-cyber-light text-white"
              placeholder="Productivity, Design, Utilities..."
              data-testid="input-category"
              data-agent-id="listing-category"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-gray-300">Tags (comma-separated)</Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="bg-cyber-dark border-cyber-light text-white"
              placeholder="PWA, Mobile, Offline-first"
              data-testid="input-tags"
              data-agent-id="listing-tags"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-cyber-light flex-wrap">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-neon-blue hover:bg-white text-black font-bold"
            data-testid="button-submit-form"
            data-agent-id="listing-submit"
          >
            {isSubmitting ? 'Saving...' : editingApp ? 'Update App' : 'Submit App'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-cyber-light text-gray-300 hover:text-white"
            data-testid="button-cancel"
            data-agent-id="listing-cancel"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

