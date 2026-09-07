import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Building2,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Upload,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  MapPin,
  Landmark,
  ArrowRight,
  Download,
  Trash2,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { userService } from "../../services/cartService";
import { setUser, fetchCurrentUser } from "../../features/auth/authSlice";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const AdminProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("store"); // "store" | "kyc" | "bank" | "security"

  // Files
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || "");
  const [panFile, setPanFile] = useState(null);
  const [panPreview, setPanPreview] = useState(user?.sellerProfile?.panDocument?.url || "");
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(user?.sellerProfile?.aadhaarDocument?.url || "");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [isDeletingPan, setIsDeletingPan] = useState(false);
  const [isDeletingAadhaar, setIsDeletingAadhaar] = useState(false);

  // Form hooks
  const storeForm = useForm();
  const kycForm = useForm();
  const bankForm = useForm();
  const passwordForm = useForm();

  // Completion calculation
  const sp = user?.sellerProfile || {};
  const ba = sp.businessAddress || {};
  const bd = sp.bankDetails || {};

  const isStep1Complete = Boolean(
    sp.businessName?.trim() &&
    user?.name?.trim() &&
    user?.email?.trim() &&
    user?.phone?.trim()
  );

  const isStep2Complete = Boolean(
    isStep1Complete &&
    sp.panNumber?.trim() &&
    sp.panDocument?.url &&
    sp.aadhaarNumber?.trim() &&
    sp.aadhaarDocument?.url
  );

  const isStep3Complete = Boolean(
    isStep2Complete &&
    ba.addressLine1?.trim() &&
    ba.city?.trim() &&
    ba.state?.trim() &&
    ba.postalCode?.trim() &&
    bd.accountHolderName?.trim() &&
    bd.bankName?.trim() &&
    bd.accountNumber?.trim() &&
    bd.ifscCode?.trim()
  );

  const populateForms = () => {
    if (!user) return;
    const currentSp = user.sellerProfile || {};
    const currentBa = currentSp.businessAddress || {};
    const currentBd = currentSp.bankDetails || {};

    storeForm.reset({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      businessName: currentSp.businessName || "",
      storeBio: currentSp.storeBio || "",
    });

    kycForm.reset({
      panNumber: currentSp.panNumber || "",
      aadhaarNumber: currentSp.aadhaarNumber || "",
      gstNumber: currentSp.gstNumber || "",
    });

    bankForm.reset({
      addressLine1: currentBa.addressLine1 || "",
      addressLine2: currentBa.addressLine2 || "",
      city: currentBa.city || "",
      state: currentBa.state || "",
      postalCode: currentBa.postalCode || "",
      country: currentBa.country || "India",
      accountHolderName: currentBd.accountHolderName || "",
      accountNumber: currentBd.accountNumber || "",
      ifscCode: currentBd.ifscCode || "",
      bankName: currentBd.bankName || "",
    });

    setAvatarPreview(user.avatar?.url || "");
    setPanPreview(currentSp.panDocument?.url || "");
    setAadhaarPreview(currentSp.aadhaarDocument?.url || "");
  };

  useEffect(() => {
    populateForms();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlePanFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPanFile(file);
      setPanPreview(URL.createObjectURL(file));
      toast.info("New PAN document selected. Save KYC to commit changes.");
    }
  };

  const handleAadhaarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFile(file);
      setAadhaarPreview(URL.createObjectURL(file));
      toast.info("New Aadhaar document selected. Save KYC to commit changes.");
    }
  };

  const handleDeleteDocument = async (docType) => {
    if (docType === "pan") {
      if (panFile && !user?.sellerProfile?.panDocument?.url) {
        setPanFile(null);
        setPanPreview("");
        toast.info("PAN attachment removed.");
        return;
      }
      try {
        setIsDeletingPan(true);
        const res = await userService.deleteSellerDocument("pan");
        if (res.data?.user) dispatch(setUser(res.data.user));
        else dispatch(fetchCurrentUser());
        setPanFile(null);
        setPanPreview("");
        toast.success("PAN document deleted from secure vault.");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete PAN document");
      } finally {
        setIsDeletingPan(false);
      }
    } else if (docType === "aadhaar") {
      if (aadhaarFile && !user?.sellerProfile?.aadhaarDocument?.url) {
        setAadhaarFile(null);
        setAadhaarPreview("");
        toast.info("Aadhaar attachment removed.");
        return;
      }
      try {
        setIsDeletingAadhaar(true);
        const res = await userService.deleteSellerDocument("aadhaar");
        if (res.data?.user) dispatch(setUser(res.data.user));
        else dispatch(fetchCurrentUser());
        setAadhaarFile(null);
        setAadhaarPreview("");
        toast.success("Aadhaar document deleted from secure vault.");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete Aadhaar document");
      } finally {
        setIsDeletingAadhaar(false);
      }
    }
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === "kyc" && !isStep1Complete) {
      toast.warning("🔒 Step 1 (Store & Contact details) must be completed and saved before accessing KYC.");
      return;
    }
    if (tabKey === "bank" && !isStep2Complete) {
      toast.warning("🔒 Step 2 (PAN & Aadhaar Identification) must be completed and saved before accessing Bank details.");
      return;
    }
    setActiveTab(tabKey);
  };

  const onStoreSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("email", data.email.trim());
      formData.append("phone", data.phone.trim());
      formData.append("businessName", data.businessName.trim());
      formData.append("storeBio", data.storeBio ? data.storeBio.trim() : "");
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await userService.updateSellerProfile(formData);
      if (res.data?.user) dispatch(setUser(res.data.user));
      else dispatch(fetchCurrentUser());

      toast.success("Store details saved! Moving to Step 2: KYC Identification...");
      setActiveTab("kyc");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update store profile");
    }
  };

  const onKycSubmit = async (data) => {
    if (!panFile && !panPreview) {
      toast.error("Please upload a copy of your PAN Card");
      return;
    }
    if (!aadhaarFile && !aadhaarPreview) {
      toast.error("Please upload a copy of your Aadhaar Card");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("panNumber", data.panNumber.trim().toUpperCase());
      formData.append("aadhaarNumber", data.aadhaarNumber.trim());
      formData.append("gstNumber", data.gstNumber ? data.gstNumber.trim().toUpperCase() : "");
      if (panFile) formData.append("panDocument", panFile);
      if (aadhaarFile) formData.append("aadhaarDocument", aadhaarFile);

      const res = await userService.updateSellerProfile(formData);
      if (res.data?.user) dispatch(setUser(res.data.user));
      else dispatch(fetchCurrentUser());

      toast.success("KYC details saved securely! Moving to Step 3: Address & Bank Settlement...");
      setActiveTab("bank");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save KYC details");
    }
  };

  const onBankSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append(
        "businessAddress",
        JSON.stringify({
          addressLine1: data.addressLine1.trim(),
          addressLine2: data.addressLine2 ? data.addressLine2.trim() : "",
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim(),
          country: data.country || "India",
        })
      );
      formData.append(
        "bankDetails",
        JSON.stringify({
          accountHolderName: data.accountHolderName.trim(),
          accountNumber: data.accountNumber.trim(),
          ifscCode: data.ifscCode.trim().toUpperCase(),
          bankName: data.bankName.trim(),
        })
      );

      const res = await userService.updateSellerProfile(formData);
      if (res.data?.user) dispatch(setUser(res.data.user));
      else dispatch(fetchCurrentUser());

      toast.success("Profile setup complete! All business, KYC, and bank details saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save address and bank details");
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully.");
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    }
  };

  const kycStatus = user?.sellerProfile?.kycStatus || "pending";

  const renderKycStatusBanner = () => {
    switch (kycStatus) {
      case "verified":
        return (
          <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Seller KYC Verified</h4>
                <p className="text-xs opacity-85">Your identity, PAN, and business documents have been verified.</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-full uppercase tracking-wider">
              Verified
            </span>
          </div>
        );
      case "submitted":
        return (
          <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold">KYC Documents Submitted & Under Review</h4>
                <p className="text-xs opacity-85">
                  Your encrypted PAN, Aadhaar, and bank settlement details are under review.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-500 text-white rounded-full uppercase tracking-wider">
              Under Review
            </span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex flex-col gap-2 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <XCircle size={20} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">KYC Action Required</h4>
                  <p className="text-xs opacity-85">
                    {user?.sellerProfile?.kycRejectionReason || "Please re-upload clear PAN and Aadhaar copies."}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-rose-600 text-white rounded-full uppercase tracking-wider">
                Needs Revision
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-between p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Complete Your Mandatory Business & KYC Profile</h4>
                <p className="text-xs opacity-85">
                  Complete each required step to unlock all seller permissions and automated order payouts.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-full uppercase tracking-wider">
              Profile Incomplete
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl tracking-tightest">Seller Profile & Business Settings</h1>
        <p className="text-sm text-stone mt-1">
          Complete mandatory store info, PAN/Aadhaar identification (AES-256 encrypted), and bank payout details.
        </p>
      </div>

      {/* KYC Status Banner */}
      {renderKycStatusBanner()}

      {/* Progressive Step Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-hairline pb-2 dark:border-hairline-dark">
        {/* Step 1 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("store")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "store"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : isStep1Complete
                ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                : "text-[var(--accent)] bg-[var(--accent-bg)]"
            }`}
        >
          <Store size={16} />
          <span>1. Store & Contact</span>
          {isStep1Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Step 2 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("kyc")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "kyc"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : isStep1Complete
                ? isStep2Complete
                  ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                  : "text-[var(--accent)] bg-[var(--accent-bg)]"
                : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
            }`}
        >
          <FileText size={16} />
          <span>2. PAN & KYC</span>
          {!isStep1Complete ? (
            <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 1 first" />
          ) : isStep2Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Step 3 Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("bank")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "bank"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : isStep2Complete
                ? isStep3Complete
                  ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                  : "text-[var(--accent)] bg-[var(--accent-bg)]"
                : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
            }`}
        >
          <Landmark size={16} />
          <span>3. Address & Bank Payouts</span>
          {!isStep2Complete ? (
            <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 2 first" />
          ) : isStep3Complete ? (
            <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
          )}
        </button>

        {/* Security Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "security"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
            }`}
        >
          <Lock size={16} />
          <span>Security</span>
        </button>
      </div>

      {/* Tab 1: Store & Contact Info */}
      {activeTab === "store" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <div>
              <h3 className="font-display text-lg font-bold">Step 1: Store & Official Contact</h3>
              <p className="text-xs text-stone mt-0.5">
                All fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory to unlock Step 2.
              </p>
            </div>
            {isStep1Complete && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Step 1 Completed
              </span>
            )}
          </div>

          <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="flex flex-col gap-6">
            {/* Logo Upload */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--bg-subtle)] border-2 border-hairline flex items-center justify-center dark:border-hairline-dark">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={32} className="text-stone" />
                  )}
                </div>
                <label
                  htmlFor="seller-avatar-upload"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer shadow-md hover:opacity-90"
                  title="Upload Brand Logo"
                >
                  <Upload size={13} />
                </label>
                <input
                  id="seller-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold">{user?.sellerProfile?.businessName || user?.name || "Store Brand Logo"}</h4>
                <p className="text-xs text-stone mt-0.5">Square PNG, JPG, or WebP recommended</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Input
                  label="Store / Brand Name *"
                  placeholder="e.g. LyZov Gentlemen"
                  {...storeForm.register("businessName", { required: "Store / Brand Name is required" })}
                  error={storeForm.formState.errors.businessName?.message}
                />
              </div>

              <div>
                <Input
                  label="Contact Person Full Name *"
                  placeholder="e.g. Rahul Sharma"
                  {...storeForm.register("name", { required: "Contact Person Full Name is required" })}
                  error={storeForm.formState.errors.name?.message}
                />
              </div>

              <div>
                <Input
                  label="Official Email Address *"
                  type="email"
                  placeholder="seller@example.com"
                  {...storeForm.register("email", {
                    required: "Official Email is required",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Please provide a valid email" },
                  })}
                  error={storeForm.formState.errors.email?.message}
                />
              </div>

              <div>
                <Input
                  label="Mobile / Phone Number *"
                  type="tel"
                  placeholder="10-digit mobile number (e.g. 9876543210)"
                  {...storeForm.register("phone", {
                    required: "Mobile / Phone number is required",
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: "Please enter a valid 10-digit Indian mobile number",
                    },
                  })}
                  error={storeForm.formState.errors.phone?.message}
                />
                <span className="text-[0.7rem] text-stone mt-1 block">Compulsory for OTP alerts & courier pickup notices</span>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone">
                  Store Bio / Brand Heritage (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell customers about your products, quality assurance, and heritage..."
                  {...storeForm.register("storeBio")}
                  className="w-full rounded-xl border border-hairline bg-[var(--surface)] p-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] dark:border-hairline-dark dark:bg-[var(--bg-raised)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone">Saving will automatically unlock Step 2 (KYC)</span>
              <Button type="submit" isLoading={storeForm.formState.isSubmitting} className="flex items-center gap-2">
                <span>Save & Continue to Step 2</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: PAN & KYC Identification */}
      {activeTab === "kyc" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <div>
              <h3 className="font-display text-lg font-bold">Step 2: PAN & Aadhaar KYC Identification</h3>
              <p className="text-xs text-stone mt-0.5">
                PAN and Aadhaar numbers & documents are encrypted with AES-256 and compulsory (<span className="text-rose-500 font-bold">*</span>).
              </p>
            </div>
            {isStep2Complete && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Step 2 Completed
              </span>
            )}
          </div>

          <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* PAN Number */}
              <div>
                <Input
                  label="PAN Card Number *"
                  placeholder="e.g. ABCDE1234F"
                  {...kycForm.register("panNumber", {
                    required: "PAN Card Number is required",
                    pattern: {
                      value: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/,
                      message: "Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)",
                    },
                  })}
                  error={kycForm.formState.errors.panNumber?.message}
                />
                <span className="text-[0.7rem] text-stone mt-1 block">Compulsory Permanent Account Number (Encrypted AES-256)</span>
              </div>

              {/* GSTIN (Optional) */}
              <div>
                <Input
                  label="GSTIN (Optional)"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  {...kycForm.register("gstNumber", {
                    pattern: {
                      value: /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}Z[0-9A-Za-z]{1}$/,
                      message: "Invalid GSTIN format (15 characters)",
                    },
                  })}
                  error={kycForm.formState.errors.gstNumber?.message}
                />
                <span className="text-[0.7rem] text-stone mt-1 block">Required if annual turnover exceeds GST threshold</span>
              </div>

              {/* Aadhaar Number with mask */}
              <div className="sm:col-span-2">
                <div className="relative">
                  <Input
                    label="Aadhaar Card Number (12 Digits) *"
                    type={showAadhaar ? "text" : "password"}
                    placeholder="Enter 12-digit Aadhaar Number"
                    {...kycForm.register("aadhaarNumber", {
                      required: "12-digit Aadhaar Number is required",
                      pattern: {
                        value: /^\d{12}$/,
                        message: "Aadhaar must be exactly 12 numeric digits",
                      },
                    })}
                    error={kycForm.formState.errors.aadhaarNumber?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAadhaar(!showAadhaar)}
                    className="absolute right-3.5 top-8 text-stone hover:text-[var(--ink)]"
                    title={showAadhaar ? "Hide Aadhaar" : "Show Aadhaar"}
                  >
                    {showAadhaar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[0.7rem] text-stone mt-1 block">Compulsory 12-digit UIDAI Identification (Encrypted AES-256)</span>
              </div>
            </div>

            {/* Document Cards (Protected: No open preview, with Download & Delete/Replace options) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2 border-t border-hairline dark:border-hairline-dark">
              {/* PAN Document Card */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone flex items-center justify-between">
                  <span>PAN Card Document *</span>
                  {panPreview ? (
                    <span className="text-emerald-600 lowercase font-normal flex items-center gap-1">
                      <CheckCircle2 size={12} /> Document Attached
                    </span>
                  ) : (
                    <span className="text-rose-500 lowercase font-normal">required</span>
                  )}
                </label>

                {panPreview ? (
                  <div className="p-4 rounded-xl border border-hairline bg-[var(--surface)] dark:border-hairline-dark dark:bg-[var(--bg-raised)] flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold truncate">PAN_Card_Document</h5>
                          <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold">
                            Encrypted
                          </span>
                        </div>
                        <p className="text-[0.7rem] text-stone truncate mt-0.5">
                          {panFile ? `Selected: ${panFile.name}` : "Stored securely in merchant vault"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-hairline/60 dark:border-hairline-dark/60 gap-2">
                      <div className="flex items-center gap-2">
                        {/* Download Document */}
                        <a
                          href={panPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          download="PAN_Document"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-raised)] text-[var(--ink)] border border-hairline dark:border-hairline-dark transition-all"
                          title="Download PAN Document"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>

                        {/* Direct View in new tab */}
                        <a
                          href={panPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-stone hover:text-[var(--ink)] transition-colors"
                          title="Open Document"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Replace Document */}
                        <label
                          htmlFor="pan-doc-upload"
                          className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          <Upload size={12} />
                          <span>Replace</span>
                        </label>

                        {/* Delete Document */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument("pan")}
                          disabled={isDeletingPan}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete PAN Document"
                        >
                          <Trash2 size={13} />
                          <span>{isDeletingPan ? "..." : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                    <FileText size={24} className="text-rose-500" />
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">PAN document copy required</span>
                    <label
                      htmlFor="pan-doc-upload"
                      className="mt-1 cursor-pointer text-xs font-bold bg-[var(--accent)] text-white px-3 py-1.5 rounded-lg hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload size={13} /> Upload PAN Copy
                    </label>
                  </div>
                )}

                <input
                  id="pan-doc-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handlePanFileChange}
                  className="hidden"
                />
              </div>

              {/* Aadhaar Document Card */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone flex items-center justify-between">
                  <span>Aadhaar Card Document *</span>
                  {aadhaarPreview ? (
                    <span className="text-emerald-600 lowercase font-normal flex items-center gap-1">
                      <CheckCircle2 size={12} /> Document Attached
                    </span>
                  ) : (
                    <span className="text-rose-500 lowercase font-normal">required</span>
                  )}
                </label>

                {aadhaarPreview ? (
                  <div className="p-4 rounded-xl border border-hairline bg-[var(--surface)] dark:border-hairline-dark dark:bg-[var(--bg-raised)] flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold truncate">Aadhaar_Card_Document</h5>
                          <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold">
                            Encrypted
                          </span>
                        </div>
                        <p className="text-[0.7rem] text-stone truncate mt-0.5">
                          {aadhaarFile ? `Selected: ${aadhaarFile.name}` : "Stored securely in merchant vault"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-hairline/60 dark:border-hairline-dark/60 gap-2">
                      <div className="flex items-center gap-2">
                        {/* Download Document */}
                        <a
                          href={aadhaarPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          download="Aadhaar_Document"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-raised)] text-[var(--ink)] border border-hairline dark:border-hairline-dark transition-all"
                          title="Download Aadhaar Document"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>

                        {/* Direct View in new tab */}
                        <a
                          href={aadhaarPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-stone hover:text-[var(--ink)] transition-colors"
                          title="Open Document"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Replace Document */}
                        <label
                          htmlFor="aadhaar-doc-upload"
                          className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          <Upload size={12} />
                          <span>Replace</span>
                        </label>

                        {/* Delete Document */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument("aadhaar")}
                          disabled={isDeletingAadhaar}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Aadhaar Document"
                        >
                          <Trash2 size={13} />
                          <span>{isDeletingAadhaar ? "..." : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                    <FileText size={24} className="text-rose-500" />
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Aadhaar document copy required</span>
                    <label
                      htmlFor="aadhaar-doc-upload"
                      className="mt-1 cursor-pointer text-xs font-bold bg-[var(--accent)] text-white px-3 py-1.5 rounded-lg hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload size={13} /> Upload Aadhaar Copy
                    </label>
                  </div>
                )}

                <input
                  id="aadhaar-doc-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAadhaarFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("store")}
                className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
              >
                ← Back to Step 1
              </button>
              <Button type="submit" isLoading={kycForm.formState.isSubmitting} className="flex items-center gap-2">
                <span>Save & Continue to Step 3</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Address & Bank Settlement */}
      {activeTab === "bank" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <div>
              <h3 className="font-display text-lg font-bold">Step 3: Registered Business Address & Bank Settlement</h3>
              <p className="text-xs text-stone mt-0.5">
                All fields marked with <span className="text-rose-500 font-bold">*</span> are compulsory for order payouts and shipping pickups.
              </p>
            </div>
            {isStep3Complete && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Profile Complete
              </span>
            )}
          </div>

          <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="flex flex-col gap-6">
            {/* Bank Details Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3 flex items-center gap-1.5">
                <Landmark size={14} /> Settlement Bank Account Details *
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Account Holder Name *"
                  placeholder="Name as per bank passbook"
                  {...bankForm.register("accountHolderName", { required: "Account Holder Name is required" })}
                  error={bankForm.formState.errors.accountHolderName?.message}
                />
                <Input
                  label="Bank Name *"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  {...bankForm.register("bankName", { required: "Bank Name is required" })}
                  error={bankForm.formState.errors.bankName?.message}
                />
                <Input
                  label="Bank Account Number *"
                  placeholder="Enter Bank Account Number"
                  {...bankForm.register("accountNumber", { required: "Account Number is required" })}
                  error={bankForm.formState.errors.accountNumber?.message}
                />
                <Input
                  label="Bank IFSC Code *"
                  placeholder="e.g. HDFC0001234"
                  {...bankForm.register("ifscCode", {
                    required: "IFSC Code is required",
                    pattern: {
                      value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                      message: "Must be an 11-character IFSC Code (e.g. HDFC0001234)",
                    },
                  })}
                  error={bankForm.formState.errors.ifscCode?.message}
                />
              </div>
            </div>

            {/* Business Address Section */}
            <div className="pt-4 border-t border-hairline dark:border-hairline-dark">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3 flex items-center gap-1.5">
                <MapPin size={14} /> Registered Operational / Pickup Address *
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Address Line 1 (Building / Street) *"
                  className="sm:col-span-2"
                  placeholder="e.g. Plot 42, Textile Market Road"
                  {...bankForm.register("addressLine1", { required: "Address Line 1 is required" })}
                  error={bankForm.formState.errors.addressLine1?.message}
                />
                <Input
                  label="Address Line 2 (Landmark / Suite)"
                  placeholder="Near City Center"
                  {...bankForm.register("addressLine2")}
                />
                <Input
                  label="City *"
                  placeholder="e.g. Surat, Mumbai, Jaipur"
                  {...bankForm.register("city", { required: "City is required" })}
                  error={bankForm.formState.errors.city?.message}
                />
                <Input
                  label="State *"
                  placeholder="e.g. Gujarat, Maharashtra, Rajasthan"
                  {...bankForm.register("state", { required: "State is required" })}
                  error={bankForm.formState.errors.state?.message}
                />
                <Input
                  label="Postal / PIN Code (6 Digits) *"
                  placeholder="e.g. 395002"
                  {...bankForm.register("postalCode", {
                    required: "Postal Code is required",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "Postal code must be 6 digits",
                    },
                  })}
                  error={bankForm.formState.errors.postalCode?.message}
                />
                <Input label="Country" defaultValue="India" {...bankForm.register("country")} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("kyc")}
                className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
              >
                ← Back to Step 2
              </button>
              <Button type="submit" isLoading={bankForm.formState.isSubmitting} className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Save All & Complete Setup</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Security (Password) */}
      {activeTab === "security" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <h3 className="font-display text-lg font-bold">Security & Password</h3>
            <p className="text-xs text-stone mt-0.5">Keep your seller account secure by updating your password regularly.</p>
          </div>

          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Current Password"
              type="password"
              {...passwordForm.register("currentPassword", { required: "Current password is required" })}
              error={passwordForm.formState.errors.currentPassword?.message}
            />
            <div className="hidden sm:block" />
            <Input
              label="New Password"
              type="password"
              {...passwordForm.register("newPassword", {
                required: "New password is required",
                minLength: { value: 8, message: "Must be at least 8 characters" },
              })}
              error={passwordForm.formState.errors.newPassword?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...passwordForm.register("confirmPassword", {
                validate: (val) => val === passwordForm.watch("newPassword") || "Passwords do not match",
              })}
              error={passwordForm.formState.errors.confirmPassword?.message}
            />
            <div className="sm:col-span-2 mt-2">
              <Button type="submit" variant="secondary" isLoading={passwordForm.formState.isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProfilePage;
