'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../lib/axios';

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
  const [submittedHerb, setSubmittedHerb] = useState<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>(null);

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
      if (informationSource.trim()) formData.append('informationSource', informationSource.trim());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/suggest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.status === 'success') {
        setSubmittedHerb(response.data.data.suggestion);
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(response.data?.message || 'Failed to submit suggestion.');
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-green-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
            <p className="font-extrabold text-[#1b4332]">Verifying session details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="mb-10 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-black text-green-700 shadow-sm uppercase tracking-wider mb-4">
            📖 Contribute Knowledge
          </span>
          <h1 className="text-4xl lg:text-5xl font-serif-custom font-black italic text-[#1b4332] tracking-tight">
            {user?.role === 'admin' ? 'Add a New Herb' : 'Suggest a New Herb'}
          </h1>
          <p className="text-[#2d6a4f] font-bold mt-2 max-w-2xl">
            Help expand our collective library of Philippine traditional herbal medicines. Submitted suggestions will be reviewed by botanists and traditional health specialists before publication.
          </p>
        </div>

        {error && (
          <div 
            role="alert" 
            className="mb-8 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-extrabold rounded-xl shadow-sm text-sm flex items-start gap-3"
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-black text-rose-950">Submission Issue Detected</p>
              <p className="mt-1 font-bold">{error}</p>
            </div>
          </div>
        )}

        {success ? (
          /* SUCCESS SCREEN */
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl mb-12 animate-fade-in">
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-3xl shadow-sm">
                ✅
              </div>
              
              <div>
                <h2 className="text-3xl font-black text-[#1b4332]">Thank You!</h2>
                <p className="text-lg font-bold text-[#40916c] mt-1">
                  {user?.role === 'admin' ? 'Herb Added Successfully' : 'Suggestion Submitted Successfully'}
                </p>
              </div>

              <p className="text-sm font-bold text-[#6a7282] leading-relaxed">
                {user?.role === 'admin' ? (
                  <>
                    Your new herb entry for <span className="text-[#1b4332] font-black underline">{submittedHerb?.localName || localName}</span> has been successfully added directly to the database library.
                  </>
                ) : (
                  <>
                    Your suggestion for <span className="text-[#1b4332] font-black underline">{submittedHerb?.localName || localName}</span> has been logged and queued for professional botanical review. Thank you for preserving Filipino healing traditions!
                  </>
                )}
              </p>

              {/* Submitted Summary Card */}
              <div className="w-full border border-gray-200 bg-gray-50 rounded-xl p-5 text-left shadow-sm space-y-4">
                <h3 className="font-black text-[#1b4332] border-b border-[#1b4332]/10 pb-2">Record Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <span className="text-[#6a7282] block">Local Name</span>
                    <span className="text-[#1b4332] font-extrabold text-sm">{submittedHerb?.localName || localName}</span>
                  </div>
                  <div>
                    <span className="text-[#6a7282] block">Scientific Name</span>
                    <span className="text-[#1b4332] font-extrabold text-sm italic">{submittedHerb?.scientificName || scientificName}</span>
                  </div>
                  <div>
                    <span className="text-[#6a7282] block">Category</span>
                    <span className="text-[#1b4332] font-extrabold text-sm">{submittedHerb?.category || category}</span>
                  </div>
                  {cebuanoName && (
                    <div>
                      <span className="text-[#6a7282] block">Common Name</span>
                      <span className="text-[#1b4332] font-extrabold text-sm">{submittedHerb?.cebuanoName || cebuanoName}</span>
                    </div>
                  )}
                </div>

                {(submittedHerb?.imageUrl || imagePreview) && (
                  <div className="mt-2">
                    <span className="text-[#6a7282] text-xs block mb-1">Attached Image</span>
                    <div className="relative aspect-video w-full max-h-48 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
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
                  className="flat-button flat-button-primary"
                >
                  {user?.role === 'admin' ? 'Add Another Plant' : 'Suggest Another Plant'}
                </button>
                <button
                  onClick={() => router.push('/library')}
                  className="flat-button flat-button-secondary"
                >
                  Explore Plant Library
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MULTIPART OBSERVATION FORM */
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 lg:p-10 shadow-xl mb-12 space-y-8">
            
            {/* Section 1: Classification */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] border-b border-[#1b4332]/10 pb-2 flex items-center gap-2">
                <span className="text-2xl">🏷️</span> Taxonomy & Identification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="localName">
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
                    className="flat-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="scientificName">
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
                    className="flat-input italic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="cebuanoName">
                    Common Name <span className="text-xs font-bold text-[#6a7282]">(Optional)</span>
                  </label>
                  <input
                    id="cebuanoName"
                    type="text"
                    placeholder="e.g. Alibhon, Gabon"
                    value={cebuanoName}
                    onChange={(e) => setCebuanoName(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="category">
                    Medicinal Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input bg-white appearance-none"
                  >
                    <option value="" disabled>-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Botanical Image Upload */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] border-b border-[#1b4332]/10 pb-2 flex items-center gap-2">
                <span className="text-2xl">📸</span> Plant Illustration or Photo
              </h2>

              <div className="border-2 border-dashed border-green-700/30 hover:border-green-700 rounded-xl p-6 bg-green-50/20 transition-colors flex flex-col items-center justify-center text-center">
                {imagePreview ? (
                  <div className="space-y-4 w-full max-w-md">
                    <div className="relative aspect-video w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <img 
                        src={imagePreview} 
                        alt="Herb upload preview" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#1b4332] bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                      <span className="truncate max-w-[200px]">{imageFile?.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isSubmitting}
                        className="text-rose-700 hover:text-rose-950 font-black cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-4xl">🌱</div>
                    <div>
                      <p className="font-extrabold text-[#1b4332] text-sm">
                        Select a file to upload
                      </p>
                      <p className="text-xs text-[#6a7282] font-bold mt-1">
                        Acceptable formats: JPEG, JPG, PNG, WEBP (Max 5MB)
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="flat-button flat-button-secondary !py-1.5 !px-4 text-xs mt-2"
                      >
                        Choose Image File
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

            {/* Section 3: Applications and Preparation */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] border-b border-[#1b4332]/10 pb-2 flex items-center gap-2">
                <span className="text-2xl">🍵</span> Medical Application & Usage
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="medicinalUses">
                    Medicinal Uses & Key Applications <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="medicinalUses"
                    required
                    rows={4}
                    placeholder="Describe what illnesses, ailments, or symptoms this herb treats. (e.g. Used to treat coughs, colds, fever, and helps dissolve kidney stones)."
                    value={medicinalUses}
                    onChange={(e) => setMedicinalUses(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="preparationMethod">
                    Boiling & Preparation Instructions <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="preparationMethod"
                    required
                    rows={4}
                    placeholder="Describe how to prepare the herb. (e.g. Chop fresh leaves and boil in 2 glasses of water for 15 minutes with the pot cover left off)."
                    value={preparationMethod}
                    onChange={(e) => setPreparationMethod(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="dosage">
                    Recommended Dosage & Administration <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="dosage"
                    required
                    rows={3}
                    placeholder="Specify the correct amount and frequency of administration. (e.g. Drink 1/3 cup, three times a day. For coughs, drink warm decoction)."
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Secondary Attributes */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b4332] border-b border-[#1b4332]/10 pb-2 flex items-center gap-2">
                <span className="text-2xl">⚠️</span> Warnings & Additional Metadata
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="regionFound">
                    Primary Region / Habitat / Environment <span className="text-xs font-bold text-[#6a7282]">(Optional)</span>
                  </label>
                  <input
                    id="regionFound"
                    type="text"
                    placeholder="e.g. Common in low-altitude grasslands and agricultural zones across Luzon"
                    value={regionFound}
                    onChange={(e) => setRegionFound(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="warnings">
                    Warnings & Contraindications <span className="text-xs font-bold text-[#6a7282]">(Optional)</span>
                  </label>
                  <textarea
                    id="warnings"
                    rows={3}
                    placeholder="Specify cases where this herb should NOT be used. (e.g. Avoid usage in pregnant or lactating mothers. Excessive doses may cause stomach upset)."
                    value={warnings}
                    onChange={(e) => setWarnings(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="informationSource">
                    Source of Healing Knowledge / Documentation <span className="text-xs font-bold text-[#6a7282]">(Optional)</span>
                  </label>
                  <input
                    id="informationSource"
                    type="text"
                    placeholder="e.g. Oral folklore from elders of Barangay Silang, or PITAHC handbook"
                    value={informationSource}
                    onChange={(e) => setInformationSource(e.target.value)}
                    disabled={isSubmitting}
                    className="flat-input"
                  />
                </div>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="flat-button flat-button-secondary sm:w-auto w-full text-center"
              >
                Clear Fields
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flat-button flat-button-primary sm:w-auto w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                    {user?.role === 'admin' ? 'Adding Herb...' : 'Submitting Suggestion...'}
                  </>
                ) : (
                  user?.role === 'admin' ? 'Add Herb to Library' : 'Submit Suggestion for Review'
                )}
              </button>
            </div>

          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
