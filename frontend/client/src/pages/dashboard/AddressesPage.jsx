import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { MapPin, Trash2, Plus, X, CheckCircle2, Home, Briefcase, Tag, Phone as PhoneIcon, User } from "lucide-react";
import { addressService } from "../../services/cartService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      type: "home",
      isDefault: false,
    },
  });

  // Watch form values for step completion
  const formValues = watch();

  // Step completion calculations
  const isStep1Complete = Boolean(
    formValues?.fullName?.trim() &&
    formValues?.phone?.trim()
  );

  const isStep2Complete = Boolean(
    isStep1Complete &&
    formValues?.addressLine1?.trim() &&
    formValues?.city?.trim() &&
    formValues?.state?.trim() &&
    formValues?.postalCode?.trim() &&
    formValues?.country?.trim()
  );

  const loadAddresses = () => {
    addressService
      .getAddresses()
      .then((res) => {
        setAddresses(res.data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load addresses:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const onSubmit = async (data) => {
    try {
      await addressService.createAddress(data);
      toast.success("Address added successfully");
      reset();
      setShowAddForm(false);
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add address");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    try {
      await addressService.deleteAddress(id);
      toast.success("Address removed");
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove address");
    }
  };

  const handleCancel = () => {
    reset();
    setShowAddForm(false);
  };

  if (isLoading) return <div className="skeleton h-48 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold">Saved Addresses</h3>
          <p className="text-xs text-stone mt-0.5">Manage your delivery and billing addresses.</p>
        </div>
        <Button
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          icon={showAddForm ? X : Plus}
          onClick={() => {
            if (showAddForm) {
              handleCancel();
            } else {
              setShowAddForm(true);
            }
          }}
        >
          {showAddForm ? "Cancel" : "Add Address"}
        </Button>
      </div>

      {/* Inline Single-Step Address Form (No Popup Modal) */}
      {showAddForm && (
        <div className="card-surface p-6 sm:p-8 rounded-2xl border border-hairline dark:border-hairline-dark shadow-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-hairline dark:border-hairline-dark">
            <div>
              <h4 className="font-display text-lg font-bold">Add New Delivery Address</h4>
              <p className="text-xs text-stone mt-0.5">
                All fields marked with <span className="text-rose-500 font-bold">*</span> are required.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-stone hover:text-[var(--ink)] p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Contact Information */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone mb-3 flex items-center gap-1.5">
                <User size={14} className="text-[var(--accent)]" /> Contact Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Vikram Sharma"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: { value: 2, message: "At least 2 characters" },
                  })}
                  error={errors.fullName?.message}
                />
                <Input
                  label="Phone Number *"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: "Please enter a valid 10-digit Indian mobile number",
                    },
                  })}
                  error={errors.phone?.message}
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone mb-3 flex items-center gap-1.5">
                <Home size={14} className="text-[var(--accent)]" /> Address Details
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Address Line 1 (Flat, House No., Building, Street) *"
                  placeholder="e.g. Flat 402, Royal Palms, MG Road"
                  className="sm:col-span-2"
                  {...register("addressLine1", { required: "Address line 1 is required" })}
                  error={errors.addressLine1?.message}
                />
                <Input
                  label="Address Line 2 (Area, Landmark - Optional)"
                  placeholder="e.g. Near City Center Mall"
                  className="sm:col-span-2"
                  {...register("addressLine2")}
                />
                <Input
                  label="City *"
                  placeholder="e.g. Mumbai"
                  {...register("city", { required: "City is required" })}
                  error={errors.city?.message}
                />
                <Input
                  label="State *"
                  placeholder="e.g. Maharashtra"
                  {...register("state", { required: "State is required" })}
                  error={errors.state?.message}
                />
                <Input
                  label="PIN / Postal Code *"
                  placeholder="e.g. 400001"
                  {...register("postalCode", {
                    required: "Postal code is required",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "Please enter a valid 6-digit PIN code",
                    },
                  })}
                  error={errors.postalCode?.message}
                />
                <Input
                  label="Country *"
                  placeholder="e.g. India"
                  {...register("country", { required: "Country is required" })}
                  error={errors.country?.message}
                />
              </div>
            </div>

            {/* Address Type & Default */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-hairline dark:border-hairline-dark pt-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-stone uppercase tracking-wider">
                  Address Type
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg border border-hairline dark:border-hairline-dark hover:bg-[var(--bg-subtle)] transition-colors">
                    <input type="radio" value="home" {...register("type")} className="accent-[var(--accent)]" />
                    <Home size={14} className="text-stone" />
                    <span>Home</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg border border-hairline dark:border-hairline-dark hover:bg-[var(--bg-subtle)] transition-colors">
                    <input type="radio" value="work" {...register("type")} className="accent-[var(--accent)]" />
                    <Briefcase size={14} className="text-stone" />
                    <span>Work</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg border border-hairline dark:border-hairline-dark hover:bg-[var(--bg-subtle)] transition-colors">
                    <input type="radio" value="other" {...register("type")} className="accent-[var(--accent)]" />
                    <Tag size={14} className="text-stone" />
                    <span>Other</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm cursor-pointer self-end pb-1">
                <input
                  type="checkbox"
                  {...register("isDefault")}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <span className="font-medium text-[var(--ink)]">Set as default address</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline dark:border-hairline-dark">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} icon={CheckCircle2}>
                Save Address
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center card-surface rounded-2xl border border-hairline dark:border-hairline-dark">
          <MapPin size={36} className="text-stone" strokeWidth={1.25} />
          <p className="text-sm text-stone">No saved addresses yet.</p>
          <Button size="sm" icon={Plus} onClick={() => setShowAddForm(true)}>
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`card-surface flex items-start justify-between gap-3 p-5 rounded-xl border transition-all ${
                addr.isDefault
                  ? "border-[var(--accent)]/40 shadow-sm"
                  : "border-hairline dark:border-hairline-dark"
              }`}
            >
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--ink)]">{addr.fullName}</p>
                  {addr.type && (
                    <span className="capitalize text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-stone border border-hairline dark:border-hairline-dark">
                      {addr.type}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="text-[11px] font-semibold text-gold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-stone">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                </p>
                <p className="text-stone">
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
                <p className="text-stone">{addr.country}</p>
                <p className="text-stone text-xs flex items-center gap-1.5 pt-1">
                  <PhoneIcon size={12} />
                  <span>{addr.phone}</span>
                </p>
              </div>
              <button
                onClick={() => handleDelete(addr._id)}
                className="text-stone hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Delete address"
                aria-label="Delete address"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
