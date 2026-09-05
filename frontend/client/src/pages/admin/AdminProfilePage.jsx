import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Building2,
  FileText,
  CreditCard,
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
  UserCheck,
} from "lucide-react";
import { userService } from "../../services/cartService";
import { setUser, fetchCurrentUser } from "../../features/auth/authSlice";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const businessTypes = [
  { value: "individual", label: "Individual / Sole Proprietor" },
  { value: "proprietorship", label: "Proprietorship Firm" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "private_limited", label: "Private Limited Company (Pvt Ltd)" },
];

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

  // Forms
  const storeForm = useForm();
  const kycForm = useForm();
  const bankForm = useForm();
  const passwordForm = useForm();

  const populateForms = () => {
    if (!user) return;
    const sp = user.sellerProfile || {};
    const ba = sp.businessAddress || {};
    const bd = sp.bankDetails || {};

    storeForm.reset({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      businessName: sp.businessName || "",
      businessType: sp.businessType || "individual",
      storeBio: sp.storeBio || "",
    });

    kycForm.reset({
      panNumber: sp.panNumber || "",
      aadhaarNumber: sp.aadhaarNumber || "",
      gstNumber: sp.gstNumber || "",
    });

    bankForm.reset({
      addressLine1: ba.addressLine1 || "",
      addressLine2: ba.addressLine2 || "",
      city: ba.city || "",
      state: ba.state || "",
      postalCode: ba.postalCode || "",
      country: ba.country || "India",
      accountHolderName: bd.accountHolderName || "",
      accountNumber: bd.accountNumber || "",
      ifscCode: bd.ifscCode || "",
      bankName: bd.bankName || "",
    });

    setAvatarPreview(user.avatar?.url || "");
    setPanPreview(sp.panDocument?.url || "");
    setAadhaarPreview(sp.aadhaarDocument?.url || "");
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
    }
  };

  const handleAadhaarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFile(file);
      setAadhaarPreview(URL.createObjectURL(file));
    }
  };

  const onStoreSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("email", data.email.trim());
      formData.append("phone", data.phone ? data.phone.trim() : "");
      formData.append("businessName", data.businessName ? data.businessName.trim() : "");
      formData.append("businessType", data.businessType || "");
      formData.append("storeBio", data.storeBio ? data.storeBio.trim() : "");
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await userService.updateSellerProfile(formData);
      if (res.data?.user) dispatch(setUser(res.data.user));
      else dispatch(fetchCurrentUser());
      toast.success("Store details updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update store profile");
    }
  };

  const onKycSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("panNumber", data.panNumber ? data.panNumber.trim().toUpperCase() : "");
      formData.append("aadhaarNumber", data.aadhaarNumber ? data.aadhaarNumber.trim() : "");
      formData.append("gstNumber", data.gstNumber ? data.gstNumber.trim().toUpperCase() : "");
      if (panFile) formData.append("panDocument", panFile);
      if (aadhaarFile) formData.append("aadhaarDocument", aadhaarFile);

      const res = await userService.updateSellerProfile(formData);
      if (res.data?.user) dispatch(setUser(res.data.user));
      else dispatch(fetchCurrentUser());
      toast.success("Business identification & KYC details saved!");
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
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          state: data.state || "",
          postalCode: data.postalCode || "",
          country: data.country || "India",
        })
      );
      formData.append(
        "bankDetails",
        JSON.stringify({
          accountHolderName: data.accountHolderName || "",
          accountNumber: data.accountNumber || "",
          ifscCode: (data.ifscCode || "").toUpperCase(),
          bankName: data.bankName || "",
        })
      );

      const res = await userService.updateSellerProfile(formData);
      if (res.data?.user) dispatch(setUser(res.data.user));
      else dispatch(fetchCurrentUser());
      toast.success("Business address & bank settlement details saved!");
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
                <h4 className="text-sm font-bold">KYC Documents Under Review</h4>
                <p className="text-xs opacity-85">
                  Your submitted PAN and Aadhaar documents are being verified by our compliance team.
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
                <h4 className="text-sm font-bold">Complete Your Business & KYC Profile</h4>
                <p className="text-xs opacity-85">
                  Provide your business PAN, Aadhaar, and settlement bank details to unlock all seller capabilities.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-full uppercase tracking-wider">
              Pending
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
        <p className="text-sm text-stone mt-1">Manage your brand presence, business identification, PAN/Aadhaar details, and settlements.</p>
      </div>

      {/* KYC Banner */}
      {renderKycStatusBanner()}

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-hairline pb-2 dark:border-hairline-dark">
        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "store"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
          }`}
        >
          <Store size={16} />
          <span>Store & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kyc")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "kyc"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
          }`}
        >
          <FileText size={16} />
          <span>PAN & KYC Identification</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "bank"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
          }`}
        >
          <Landmark size={16} />
          <span>Address & Bank Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "security"
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
          <div className="mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <h3 className="font-display text-lg font-bold">Store & Public Profile</h3>
            <p className="text-xs text-stone mt-0.5">Details that represent your brand and official communication channels.</p>
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
                <h4 className="text-sm font-bold">{user?.sellerProfile?.businessName || user?.name || "LyZov Seller"}</h4>
                <p className="text-xs text-stone mt-0.5">Recommended format: Square PNG, JPG or WebP (min. 400x400px)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="Store / Brand Name"
                placeholder="e.g. LyZov Gentlemen"
                {...storeForm.register("businessName", { required: "Store name is required" })}
                error={storeForm.formState.errors.businessName?.message}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone">
                  Business Entity Type
                </label>
                <select
                  {...storeForm.register("businessType")}
                  className="w-full rounded-xl border border-hairline bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] dark:border-hairline-dark dark:bg-[var(--bg-raised)]"
                >
                  {businessTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Contact Person Name"
                {...storeForm.register("name", { required: "Contact name is required" })}
                error={storeForm.formState.errors.name?.message}
              />

              <Input
                label="Official Email Address"
                type="email"
                {...storeForm.register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
                })}
                error={storeForm.formState.errors.email?.message}
              />

              <Input
                label="Support / WhatsApp Phone"
                placeholder="e.g. 9876543210"
                {...storeForm.register("phone")}
              />

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone">
                  Store Bio / Brand Story
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell customers about your craftsmanship, quality, and heritage..."
                  {...storeForm.register("storeBio")}
                  className="w-full rounded-xl border border-hairline bg-[var(--surface)] p-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] dark:border-hairline-dark dark:bg-[var(--bg-raised)]"
                />
              </div>
            </div>

            <div>
              <Button type="submit" isLoading={storeForm.formState.isSubmitting}>
                Save Store Details
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: PAN & KYC Identification */}
      {activeTab === "kyc" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <h3 className="font-display text-lg font-bold">Tax & Identification Documents</h3>
            <p className="text-xs text-stone mt-0.5">Required for merchant compliance and automated tax invoice generation.</p>
          </div>

          <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* PAN Number */}
              <div>
                <Input
                  label="PAN Card Number"
                  placeholder="e.g. ABCDE1234F"
                  {...kycForm.register("panNumber", {
                    pattern: {
                      value: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/,
                      message: "Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)",
                    },
                  })}
                  error={kycForm.formState.errors.panNumber?.message}
                />
                <span className="text-[0.7rem] text-stone mt-1 block">Permanent Account Number (10 characters)</span>
              </div>

              {/* GSTIN */}
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
                <span className="text-[0.7rem] text-stone mt-1 block">Required if annual turnover exceeds threshold</span>
              </div>

              {/* Aadhaar Number with mask */}
              <div className="sm:col-span-2">
                <div className="relative">
                  <Input
                    label="Aadhaar Card Number"
                    type={showAadhaar ? "text" : "password"}
                    placeholder="12-digit Aadhaar Number"
                    {...kycForm.register("aadhaarNumber", {
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
                <span className="text-[0.7rem] text-stone mt-1 block">12-digit Unique Identification Authority of India ID</span>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2 border-t border-hairline dark:border-hairline-dark">
              {/* PAN Document */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone">
                  PAN Card Document Copy
                </label>
                <div className="p-4 rounded-xl border border-dashed border-hairline bg-[var(--bg-subtle)] flex flex-col items-center justify-center gap-2 text-center dark:border-hairline-dark">
                  {panPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={panPreview} alt="PAN Document" className="max-h-28 rounded-lg object-contain" />
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Document Attached
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-stone">
                      <FileText size={24} />
                      <span className="text-xs">No PAN document attached</span>
                    </div>
                  )}
                  <label
                    htmlFor="pan-doc-upload"
                    className="mt-1 cursor-pointer text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <Upload size={13} /> {panPreview ? "Replace Document" : "Upload PAN Copy"}
                  </label>
                  <input
                    id="pan-doc-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePanFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Aadhaar Document */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone">
                  Aadhaar Card Document Copy
                </label>
                <div className="p-4 rounded-xl border border-dashed border-hairline bg-[var(--bg-subtle)] flex flex-col items-center justify-center gap-2 text-center dark:border-hairline-dark">
                  {aadhaarPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={aadhaarPreview} alt="Aadhaar Document" className="max-h-28 rounded-lg object-contain" />
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Document Attached
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-stone">
                      <FileText size={24} />
                      <span className="text-xs">No Aadhaar document attached</span>
                    </div>
                  )}
                  <label
                    htmlFor="aadhaar-doc-upload"
                    className="mt-1 cursor-pointer text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <Upload size={13} /> {aadhaarPreview ? "Replace Document" : "Upload Aadhaar Copy"}
                  </label>
                  <input
                    id="aadhaar-doc-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAadhaarFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <Button type="submit" isLoading={kycForm.formState.isSubmitting}>
                Save & Submit KYC Details
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Address & Bank Settlement */}
      {activeTab === "bank" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
            <h3 className="font-display text-lg font-bold">Business Address & Bank Settlement</h3>
            <p className="text-xs text-stone mt-0.5">Bank account information for order payouts and merchant business registered address.</p>
          </div>

          <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="flex flex-col gap-6">
            {/* Bank Details Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3 flex items-center gap-1.5">
                <Landmark size={14} /> Settlement Bank Account Details
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Account Holder Name"
                  placeholder="Name as in bank passbook"
                  {...bankForm.register("accountHolderName")}
                />
                <Input
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  {...bankForm.register("bankName")}
                />
                <Input
                  label="Bank Account Number"
                  placeholder="Enter Account Number"
                  {...bankForm.register("accountNumber")}
                />
                <Input
                  label="IFSC Code"
                  placeholder="e.g. HDFC0001234"
                  {...bankForm.register("ifscCode", {
                    pattern: {
                      value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                      message: "Invalid IFSC Code format (11 characters)",
                    },
                  })}
                  error={bankForm.formState.errors.ifscCode?.message}
                />
              </div>
            </div>

            {/* Business Address Section */}
            <div className="pt-4 border-t border-hairline dark:border-hairline-dark">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3 flex items-center gap-1.5">
                <MapPin size={14} /> Registered Business / Operational Address
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Address Line 1"
                  className="sm:col-span-2"
                  placeholder="Building No., Street, Area"
                  {...bankForm.register("addressLine1")}
                />
                <Input
                  label="Address Line 2 (Optional)"
                  placeholder="Landmark / Suite"
                  {...bankForm.register("addressLine2")}
                />
                <Input label="City" {...bankForm.register("city")} />
                <Input label="State" {...bankForm.register("state")} />
                <Input label="Postal Code" {...bankForm.register("postalCode")} />
                <Input label="Country" defaultValue="India" {...bankForm.register("country")} />
              </div>
            </div>

            <div>
              <Button type="submit" isLoading={bankForm.formState.isSubmitting}>
                Save Address & Bank Details
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
