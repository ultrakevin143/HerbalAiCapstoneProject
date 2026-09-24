'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../lib/axios';
import {
  UploadCloud,
  AlertCircle,
} from 'lucide-react';

interface Submission {
  id: number;
  localName: string;
  scientificName: string;
  cebuanoName?: string | null;
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  regionFound?: string | null;
  warnings?: string | null;
  informationSource?: string | null;
  imageUrl?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'ChangesRequested';
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SuggestHerbPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form Fields
  const [localName, setLocalName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [cebuanoName, setCebuanoName] = useState('');
  const [category, setCategory] = useState('');
  const [medicinalUses, setMedicinalUses] = useState('');
  const [preparationMethod, setPreparationMethod] = useState('');
  const [dosage, setDosage] = useState('');
  const [regionFound, setRegionFound] = useState('');
  const [warnings, setWarnings] = useState('');
  const [informationSource, setInformationSource] = useState('');

  // File Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedHerb, setSubmittedHerb] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  // Categories list based on backend expectations and capstone structure
  const categories = [
    'Respiratory',
    'Kidney Health',
    'Blood Sugar',
    'Wound Care',
    'Immune System',
    'Digestive',
    'General Wellness',
    'Other'
  ];

  // Protect client side transitions just in case middleware is bypassed
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?callbackUrl=/suggest');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const loadSubmissions = async () => {
      try {
        setSubmissionsError(null);
        const res = await api.get('/suggest/my-suggestions');
        if (!cancelled && res.data?.status === 'success') {
          setSubmissions(res.data.data.suggestions || []);
        }
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!cancelled) {
          setSubmissionsError(err.response?.data?.message || 'Failed to load your previous suggestions.');
        }
      }
    };

    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Type Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Size Validation (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Images must be under 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Basic Validation
    if (!localName.trim()) return triggerValidationError('Local / Filipino Name is required.');
    if (!scientificName.trim()) return triggerValidationError('Scientific Name is required.');
    if (!category) return triggerValidationError('Please select a category.');
    if (!medicinalUses.trim()) return triggerValidationError('Medicinal Uses are required.');
    if (!informationSource.trim()) return triggerValidationError('A source for this information is required.');
    if (!preparationMethod.trim()) return triggerValidationError('Preparation Method is required.');
    if (!dosage.trim()) return triggerValidationError('Dosage instructions are required.');

    try {
      const formData = new FormData();
      formData.append('localName', localName.trim());
      formData.append('scientificName', scientificName.trim());
      if (cebuanoName.trim()) formData.append('cebuanoName', cebuanoName.trim());
      formData.append('category', category);
      formData.append('medicinalUses', medicinalUses.trim());
      formData.append('preparationMethod', preparationMethod.trim());
      formData.append('dosage', dosage.trim());
      if (regionFound.trim()) formData.append('regionFound', regionFound.trim());
      if (warnings.trim()) formData.append('warnings', warnings.trim());
      formData.append('informationSource', informationSource.trim());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post(editingSubmission ? `/suggest/${editingSubmission.id}/resubmit` : '/suggest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.status === 'success') {
        setSubmittedHerb(response.data.data.suggestion);
        const saved = response.data.data.suggestion as Submission;
        setSubmissions((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
        setEditingSubmission(null);
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(response.data?.message || 'Failed to submit suggestion.');
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error submitting herb:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'An unexpected error occurred while submitting your suggestion. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerValidationError = (msg: string) => {
    setError(msg);
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setEditingSubmission(null);
    setLocalName('');
    setScientificName('');
    setCebuanoName('');
    setCategory('');
    setMedicinalUses('');
    setPreparationMethod('');
    setDosage('');
    setRegionFound('');
    setWarnings('');
    setInformationSource('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
    setSuccess(false);
    setSubmittedHerb(null);
  };

  const editSubmission = (submission: Submission) => {
    handleReset();
    setEditingSubmission(submission);
    setLocalName(submission.localName);
    setScientificName(submission.scientificName);
    setCebuanoName(submission.cebuanoName || '');
    setCategory(submission.category);
    setMedicinalUses(submission.medicinalUses);
    setPreparationMethod(submission.preparationMethod);
    setDosage(submission.dosage);
    setRegionFound(submission.regionFound || '');
    setWarnings(submission.warnings || '');
    setInformationSource(submission.informationSource || '');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f7f2] dark:bg-canvas">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
            <p className="font-extrabold text-[#1b4332] dark:text-ink">Verifying session details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="mb-10 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-line bg-green-50 dark:bg-soft px-4 py-1.5 text-xs font-black text-green-700 dark:text-green-300 shadow-sm uppercase tracking-wider mb-4">
            📖 Contribute Knowledge
          </span>
          <h1 className="text-4xl lg:text-5xl font-serif-custom font-black italic text-[#1b4332] dark:text-ink tracking-tight">
            {editingSubmission ? 'Revise Herb Suggestion' : user?.role === 'admin' ? 'Add a New Herb' : 'Suggest a New Herb'}
          </h1>
          <p className="text-[#2d6a4f] dark:text-muted font-bold mt-2 max-w-2xl">
            Help expand our collective library of Philippine traditional herbal medicines. Submitted suggestions will be reviewed by botanists and traditional health specialists before publication.
          </p>
        </div>

        {/* My Submissions Section */}
        {submissions.length > 0 && (
          <section className="mb-10 rounded-3xl border border-black/10 dark:border-line bg-white/45 dark:bg-panel/75 backdrop-blur-md p-6 shadow-sm" aria-label="My suggestions">
            <div className="flex items-center justify-between border-b border-[#1b4332]/10 dark:border-line pb-3 mb-4">
              <h2 className="font-serif-custom italic text-2xl font-bold text-[#1b4332] dark:text-ink">My Submissions</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eef5f0] dark:bg-soft border border-[#2d6a4f]/20 text-[#2d6a4f] dark:text-[#74c69d]">
                {submissions.length} {submissions.length === 1 ? 'record' : 'records'}
              </span>
            </div>
            {submissionsError && <p role="alert" className="mt-3 text-rose-600 font-semibold text-sm">{submissionsError}</p>}
            <div className="mt-4 grid gap-4">
              {submissions.map((submission) => (
                <article key={submission.id} className="rounded-2xl border border-black/10 dark:border-line bg-white/70 dark:bg-panel p-4 text-[#1b4332] dark:text-ink">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base">{submission.localName}</h3>
                      <p className="italic text-xs text-gray-500 dark:text-muted mt-0.5">{submission.scientificName}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-black/10 bg-white/80 dark:bg-soft text-gray-700 dark:text-muted uppercase tracking-wider">
                      {submission.status === 'ChangesRequested' ? 'Revision Needed' : submission.status}
                    </span>
                  </div>
                  {submission.reviewNotes && (
                    <p className="mt-2.5 text-xs text-gray-700 dark:text-muted whitespace-pre-wrap bg-[#eef5f0]/60 dark:bg-soft p-3 rounded-xl border border-black/5 dark:border-line">
                      <strong>Review Notes: </strong>{submission.reviewNotes}
                    </p>
                  )}
                  {submission.status === 'ChangesRequested' && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => editSubmission(submission)}
                      className="btn btn-outline border-2 border-[#2d6a4f] dark:border-[#74c69d] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-xs px-4 py-1.5 rounded-full hover:bg-[#2d6a4f]/10 transition-all mt-3"
                    >
                      Edit and resubmit
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {editingSubmission && (
          <div className="mb-6 rounded-2xl border-2 border-[#40916c] bg-white/60 dark:bg-panel/85 p-5 text-ink shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#40916c] text-white font-bold">Revision Needed</span>
              <h2 className="font-serif-custom italic text-xl font-bold text-[#1b4332] dark:text-ink">Revising: {editingSubmission.localName}</h2>
            </div>
            <p className="mt-2 text-xs text-[#2d6a4f] dark:text-muted whitespace-pre-wrap">{editingSubmission.reviewNotes}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-muted">Submitting will send your updated suggestion back to administrators for review.</p>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReset}
              className="btn btn-outline border border-[#2d6a4f] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-xs px-4 py-1 rounded-full hover:bg-[#2d6a4f]/10 transition-all mt-3"
            >
              Cancel revision
            </button>
          </div>
        )}

        {error && (
          <div 
            role="alert" 
            className="mb-8 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-extrabold rounded-xl shadow-sm text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-black text-rose-950">Submission Issue Detected</p>
              <p className="mt-1 font-bold">{error}</p>
            </div>
          </div>
        )}

        {success ? (
          /* SUCCESS SCREEN */
          <div className="glass-card bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-8 shadow-xl mb-12">
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2d6a4f] text-3xl shadow-sm text-white">
                ✅
              </div>
              
              <div>
                <h2 className="text-3xl font-black text-[#1b4332] dark:text-ink">Thank You!</h2>
                <p className="text-lg font-bold text-[#40916c] mt-1">
                  Suggestion Submitted Successfully
                </p>
              </div>

              <p className="text-sm font-bold text-[#6a7282] dark:text-muted leading-relaxed">
                Your suggestion for <span className="text-[#1b4332] dark:text-ink font-black underline">{submittedHerb?.localName || localName}</span> has been logged and queued for review. It will appear in the public library only after an administrator approves it.
              </p>

              {/* Submitted Summary Card */}
              <div className="w-full border border-gray-200 dark:border-line bg-gray-50 dark:bg-soft rounded-2xl p-5 text-left shadow-sm space-y-4">
                <h3 className="font-black text-[#1b4332] dark:text-ink border-b border-[#1b4332]/10 dark:border-line pb-2">Record Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <span className="text-[#6a7282] dark:text-muted block">Local Name</span>
                    <span className="text-[#1b4332] dark:text-ink font-extrabold text-sm">{submittedHerb?.localName || localName}</span>
                  </div>
                  <div>
                    <span className="text-[#6a7282] dark:text-muted block">Scientific Name</span>
                    <span className="text-[#1b4332] dark:text-ink font-extrabold text-sm italic">{submittedHerb?.scientificName || scientificName}</span>
                  </div>
                  <div>
                    <span className="text-[#6a7282] dark:text-muted block">Category</span>
                    <span className="text-[#1b4332] dark:text-ink font-extrabold text-sm">{submittedHerb?.category || category}</span>
                  </div>
                  {cebuanoName && (
                    <div>
                      <span className="text-[#6a7282] dark:text-muted block">Common Name</span>
                      <span className="text-[#1b4332] dark:text-ink font-extrabold text-sm">{submittedHerb?.cebuanoName || cebuanoName}</span>
                    </div>
                  )}
                </div>

                {(submittedHerb?.imageUrl || imagePreview) && (
                  <div className="mt-2">
                    <span className="text-[#6a7282] dark:text-muted text-xs block mb-1">Attached Image</span>
                    <div className="relative aspect-video w-full max-h-48 border border-gray-200 dark:border-line rounded-xl overflow-hidden bg-white shadow-sm">
                      <img 
                        src={submittedHerb?.imageUrl || imagePreview || ''} 
                        alt="Submitted Herb Preview" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                <button
                  onClick={handleReset}
                  className="btn border-[#2d6a4f] bg-[#2d6a4f] text-white font-semibold text-sm px-6 py-3 rounded-full shadow-sm hover:bg-[#1b4332] transition-colors"
                >
                  {user?.role === 'admin' ? 'Add Another Plant' : 'Suggest Another Plant'}
                </button>
                <button
                  onClick={() => router.push('/library')}
                  className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-sm px-6 py-3 rounded-full hover:bg-[#2d6a4f]/10 transition-all"
                >
                  Explore Plant Library
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MULTIPART OBSERVATION FORM */
          <form onSubmit={handleSubmit} className="glass-card bg-white/55 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 lg:p-10 shadow-xl mb-12 space-y-8">
            
            {/* Section 1: Classification */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] dark:text-ink border-b border-[#1b4332]/10 dark:border-line pb-2 flex items-center gap-2 font-serif-custom italic">
                <span className="text-2xl">🏷️</span> Taxonomy &amp; Identification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="localName">
                    Local / Filipino Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="localName"
                    type="text"
                    required
                    placeholder="e.g. Sambong, Lagundi"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="scientificName">
                    Scientific Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="scientificName"
                    type="text"
                    required
                    placeholder="e.g. Blumea balsamifera"
                    value={scientificName}
                    onChange={(e) => setScientificName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm italic text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="cebuanoName">
                    Common Name <span className="text-xs font-bold text-[#6a7282] dark:text-muted">(Optional)</span>
                  </label>
                  <input
                    id="cebuanoName"
                    type="text"
                    placeholder="e.g. Alibhon, Gabon"
                    value={cebuanoName}
                    onChange={(e) => setCebuanoName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="category">
                    Therapeutic Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                  >
                    <option value="" disabled>Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Medicinal Uses */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] dark:text-ink border-b border-[#1b4332]/10 dark:border-line pb-2 flex items-center gap-2 font-serif-custom italic">
                <span className="text-2xl">🩺</span> Medicinal Uses &amp; Indications
              </h2>

              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="medicinalUses">
                  Medicinal Uses &amp; Indications <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="medicinalUses"
                  required
                  rows={4}
                  placeholder="Detail traditional ailments treated, symptoms relieved, or clinical purposes..."
                  value={medicinalUses}
                  onChange={(e) => setMedicinalUses(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c] leading-relaxed"
                />
              </div>
            </div>

            {/* Section 3: Preparation & Dosage */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] dark:text-ink border-b border-[#1b4332]/10 dark:border-line pb-2 flex items-center gap-2 font-serif-custom italic">
                <span className="text-2xl">🥣</span> Preparation &amp; Administration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="preparationMethod">
                    Preparation Method <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="preparationMethod"
                    required
                    rows={4}
                    placeholder="Detail decoction steps, parts used (leaves, bark, roots), boiling duration..."
                    value={preparationMethod}
                    onChange={(e) => setPreparationMethod(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="dosage">
                    Dosage &amp; Frequency <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="dosage"
                    required
                    rows={4}
                    placeholder="e.g., 1/2 cup decoction 3 times daily after meals..."
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Secondary Attributes */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] dark:text-ink border-b border-[#1b4332]/10 dark:border-line pb-2 flex items-center gap-2 font-serif-custom italic">
                <span className="text-2xl">⚠️</span> Distribution, Cautions &amp; Verification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="regionFound">
                    Region Found <span className="text-xs font-bold text-[#6a7282] dark:text-muted">(Optional)</span>
                  </label>
                  <input
                    id="regionFound"
                    type="text"
                    placeholder="e.g. Luzon, Visayas, Lowland forests, Nationwide"
                    value={regionFound}
                    onChange={(e) => setRegionFound(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="informationSource">
                    Reference Source <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="informationSource"
                    type="text"
                    required
                    placeholder="e.g. DOH PITAHC Manual, Folk Medicine Elder, University Study"
                    value={informationSource}
                    onChange={(e) => setInformationSource(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="warnings">
                  Warnings &amp; Contraindications <span className="text-xs font-bold text-[#6a7282] dark:text-muted">(Optional)</span>
                </label>
                <textarea
                  id="warnings"
                  rows={3}
                  placeholder="e.g. Not recommended for pregnant women or individuals with kidney failure..."
                  value={warnings}
                  onChange={(e) => setWarnings(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c] leading-relaxed"
                />
              </div>
            </div>

            {/* Section 5: Image Upload */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] dark:text-ink border-b border-[#1b4332]/10 dark:border-line pb-2 flex items-center gap-2 font-serif-custom italic">
                <span className="text-2xl">📸</span> Plant Image <span className="text-xs font-bold text-[#6a7282] dark:text-muted">(Optional)</span>
              </h2>

              <div className="border-2 border-dashed border-black/15 dark:border-line rounded-3xl p-8 bg-white/40 dark:bg-soft transition-colors flex flex-col items-center justify-center text-center">
                {imagePreview ? (
                  <div className="space-y-4 w-full max-w-md">
                    <div className="relative aspect-video w-full border border-black/10 dark:border-line rounded-2xl overflow-hidden bg-white shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Herb upload preview"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#1b4332] dark:text-ink bg-white/80 dark:bg-panel border border-black/10 dark:border-line rounded-xl p-3 shadow-sm">
                      <span className="truncate max-w-[200px]">{imageFile?.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isSubmitting}
                        className="text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadCloud className="h-12 w-12 text-[#2d6a4f] dark:text-[#74c69d] mx-auto" />
                    <div>
                      <p className="font-bold text-[#1b4332] dark:text-ink text-sm">
                        JPG, PNG, or WEBP (Max 5MB)
                      </p>
                      <p className="text-xs text-[#6a7282] dark:text-muted font-medium mt-1">
                        High quality, clear photos of leaves, stems, or flowers are preferred.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="btn btn-outline border-2 border-[#2d6a4f] dark:border-[#74c69d] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-xs px-5 py-2.5 rounded-full hover:bg-[#2d6a4f]/10 transition-all cursor-pointer mt-2"
                      >
                        Choose File
                      </button>
                      <input
                        ref={fileInputRef}
                        id="image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#1b4332]/10 dark:border-line">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn border-[#2d6a4f] bg-[#2d6a4f] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:bg-[#1b4332] transition-colors flex-1 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Submitting Suggestion...'
                  : editingSubmission
                    ? 'Resubmit Suggestion'
                    : user?.role === 'admin'
                      ? 'Add Herb to Database'
                      : 'Submit Herb Suggestion'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="btn btn-outline border border-[#2d6a4f]/40 dark:border-line text-[#2d6a4f] dark:text-ink font-semibold text-sm px-6 py-3.5 rounded-full hover:bg-[#2d6a4f]/10 transition-all cursor-pointer"
              >
                Reset Form
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
