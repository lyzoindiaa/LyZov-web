import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { MapPin, Trash2, Plus, CheckCircle2, Lock, User, Phone as PhoneIcon, Home } from "lucide-react";
import { addressService } from "../../services/cartService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("contact"); // "contact" | "address"

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

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
    addressService.getAddresses().then((res) => {
      setAddresses(res.data);
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
      setIsModalOpen(false);
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add address");
    }
  };

  const handleDelete = async (id) => {
    try {
      await addressService.deleteAddress(id);
      toast.success("Address removed");
      loadAddresses();
    } catch (err) {
      toast.error("Could not remove address");
    }
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === "address" && !isStep1Complete) {
      toast.warning("🔒 Step 1 (Contact Information) must be completed before accessing Address details.");
      return;
    }
    setActiveTab(tabKey);
  };

  if (isLoading) return <div className="skeleton h-48 w-full rounded-xl" />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-xl">Saved Addresses</h3>
        <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MapPin size={36} className="text-stone" strokeWidth={1.25} />
          <p className="text-sm text-stone">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr._id} className="card-surface flex items-start justify-between gap-3 p-5">
              <div className="text-sm">
                <p className="font-medium">
                  {addr.fullName} {addr.isDefault && <span className="ml-1 text-xs text-gold">(Default)</span>}
                </p>
                <p className="text-stone">
                  {addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                </p>
                <p className="text-stone">{addr.phone}</p>
              </div>
              <button
                onClick={() => handleDelete(addr._id)}
                className="text-stone hover:text-red-500"
                aria-label="Delete address"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Address" size="lg">
        {/* Progressive Step Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-hairline pb-2 dark:border-hairline-dark mb-6">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => handleTabClick("contact")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "contact"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : isStep1Complete
                  ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                  : "text-[var(--accent)] bg-[var(--accent-bg)]"
              }`}
          >
            <User size={16} />
            <span>1. Contact Info</span>
            {isStep1Complete ? (
              <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
            )}
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => handleTabClick("address")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "address"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : isStep1Complete
                  ? isStep2Complete
                    ? "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
                    : "text-[var(--accent)] bg-[var(--accent-bg)]"
                  : "opacity-50 cursor-not-allowed text-stone bg-[var(--bg-subtle)]"
              }`}
          >
            <Home size={16} />
            <span>2. Address Details</span>
            {!isStep1Complete ? (
              <Lock size={14} className="text-stone ml-1" title="Locked: Complete Step 1 first" />
            ) : isStep2Complete ? (
              <CheckCircle2 size={15} className="text-emerald-500 ml-1" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Incomplete" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Tab 1: Contact Information */}
          {activeTab === "contact" && (
            <div className="card-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
                <div>
                  <h3 className="font-display text-lg font-bold">Step 1: Contact Information</h3>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Full Name *" {...register("fullName", { required: "Required" })} error={errors.fullName?.message} />
                <Input label="Phone *" {...register("phone", { required: "Required" })} error={errors.phone?.message} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-stone">Saving will automatically unlock Step 2 (Address Details)</span>
                <Button
                  type="button"
                  onClick={() => handleTabClick("address")}
                  className="flex items-center gap-2"
                >
                  <span>Continue to Step 2</span>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Tab 2: Address Details */}
          {activeTab === "address" && (
            <div className="card-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline dark:border-hairline-dark">
                <div>
                  <h3 className="font-display text-lg font-bold">Step 2: Address Details</h3>
                  <p className="text-xs text-stone mt-0.5">
                    All fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory.
                  </p>
                </div>
                {isStep2Complete && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Step 2 Completed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Address Line 1 *"
                  className="sm:col-span-2"
                  {...register("addressLine1", { required: "Required" })}
                  error={errors.addressLine1?.message}
                />
                <Input label="Address Line 2 (optional)" {...register("addressLine2")} />
                <Input label="City *" {...register("city", { required: "Required" })} error={errors.city?.message} />
                <Input label="State *" {...register("state", { required: "Required" })} error={errors.state?.message} />
                <Input
                  label="Postal Code *"
                  {...register("postalCode", { required: "Required" })}
                  error={errors.postalCode?.message}
                />
                <Input label="Country *" {...register("country", { required: "Required" })} error={errors.country?.message} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className="text-xs text-stone hover:text-[var(--ink)] underline font-medium"
                >
                  ← Back to Step 1
                </button>
                <Button type="submit" isLoading={isSubmitting} className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Save Address</span>
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AddressesPage;
