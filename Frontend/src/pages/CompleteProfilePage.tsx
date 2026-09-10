import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Check, Upload, Sparkles, User, ShieldAlert, ArrowRight, Image as ImageIcon } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
];

export const CompleteProfilePage: React.FC = () => {
  const { user, updateProfilePicture } = useAuth();
  const navigate = useNavigate();

  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatarUrl || PRESET_AVATARS[0]);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;
          setSelectedAvatar(resultStr);
          setCustomUrl('');
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomUrlApply = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAvatar || !selectedAvatar.trim()) {
      setError('Please select or upload a profile picture to complete your profile.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await updateProfilePicture(selectedAvatar);
      navigate('/seeker/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile picture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MANDATORY FIRST-TIME PROFILE SETUP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Welcome to HireHub, {user?.name || 'Candidate'}!
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            To complete your registration and activate your candidate dashboard, please set your profile picture.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-500/50 bg-neutral-800 shadow-xl flex items-center justify-center">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                    onError={() => setError('Unable to load image from provided URL.')}
                  />
                ) : (
                  <User className="w-12 h-12 text-neutral-500" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-400 text-black p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-neutral-400 mt-2 font-mono">Current Profile Picture</span>
          </div>

          {/* Preset Avatars Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-3">
              Choose from Recommended Avatars
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setError('');
                  }}
                  className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                    selectedAvatar === avatar
                      ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105'
                      : 'border-neutral-700 hover:border-neutral-500 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Image URL or Upload */}
          <div className="pt-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-2">
              Or Enter Image URL / Upload File
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleCustomUrlApply}
                className="px-3 py-2 text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Action Submit */}
          <div className="pt-4 border-t border-neutral-800">
            <button
              type="submit"
              disabled={isSubmitting || !selectedAvatar}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <span>Save & Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
